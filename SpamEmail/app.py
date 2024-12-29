from flask import Flask, render_template, request, flash, redirect, url_for, session, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError
import os
from datetime import datetime
from datetime import timedelta
import csv
from io import StringIO
from flask import send_file
from sqlalchemy import func
from spam import predict_spam




app = Flask(__name__, template_folder="template")
app.config['SECRET_KEY'] = 'hhuueubciuuusuuyteywywwoomncnncshhsh'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)  # for session time

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'

# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)


# Email tables
class SpamEmail(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(10), nullable=False, default="Spam")
    text = db.Column(db.Text, nullable=False)
    time_detected = db.Column(db.DateTime, default=datetime.utcnow)

class NonSpamEmail(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(10), nullable=False, default="Non-Spam")
    text = db.Column(db.Text, nullable=False)
    time_detected = db.Column(db.DateTime, default=datetime.utcnow)


# Registration Form
class RegistrationForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired(), Length(min=2, max=50)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8)])

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email already registered. Please choose a different one.')

# Login Form
class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('sign_up_name')
        email = request.form.get('sign_up_email')
        password = request.form.get('sign_up_password')
        
        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        if user:
            flash('Email already registered. Please use a different email.', 'danger')
            return redirect(url_for('index'))
        
        # Create new user
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(name=name, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('index'))

@app.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user)
            #flash('Login successful!', 'success')
            return redirect(url_for('prediction'))
        else:
            flash('Login failed. Please check your email and password.', 'danger')
            return redirect(url_for('index'))
        
# Dashboard Route
@app.route('/dashboard')
@login_required
def dashboard():
    # Count spam and non-spam emails
    spam_count = SpamEmail.query.count()
    non_spam_count = NonSpamEmail.query.count()
    
    return render_template('dashboard.html', 
                           spam_count=spam_count, 
                           non_spam_count=non_spam_count)


#prediction route
@app.route('/prediction')
@login_required
def prediction():
    return render_template('prediction.html')

#logout route
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

#predict route
@app.route('/predict', methods=['POST'])
@login_required

def predict():
    try:
        text = request.form.get('text', '').strip()
        if not text:
            return jsonify({'error': 'No text provided'})

        # Call the prediction function
        result = predict_spam(text)

        # Save to the database
        if result == "Spam":
            new_entry = SpamEmail(text=text)
        else:
            new_entry = NonSpamEmail(text=text)

        db.session.add(new_entry)
        db.session.commit()

        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)})
    
    

@app.route('/emails/<email_type>')
@login_required
def fetch_emails(email_type):
    if email_type == 'spam':
        emails = SpamEmail.query.order_by(SpamEmail.time_detected.desc()).all()
    elif email_type == 'non-spam':
        emails = NonSpamEmail.query.order_by(NonSpamEmail.time_detected.desc()).all()
    else:
        return jsonify({'error': 'Invalid email type'})

    # Include ID in the response
    emails_data = [
        {
            "id": email.id,
            "S/N": i + 1,
            "Text": email.text,
            "Time Detected": email.time_detected
        }
        for i, email in enumerate(emails)
    ]
    return jsonify(emails_data)


# delet email route
@app.route('/delete_email/<email_type>/<int:email_id>', methods=['DELETE'])
@login_required
def delete_email(email_type, email_id):
    try:
        if email_type == 'spam':
            email = SpamEmail.query.get_or_404(email_id)
        elif email_type == 'non-spam':
            email = NonSpamEmail.query.get_or_404(email_id)
        else:
            return jsonify({'success': False, 'error': 'Invalid email type'})

        db.session.delete(email)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


# csv download route
@app.route('/download_csv/<email_type>')
@login_required
def download_csv(email_type):
    try:
        if email_type == 'spam':
            emails = SpamEmail.query.all()
        elif email_type == 'non-spam':
            emails = NonSpamEmail.query.all()
        else:
            return 'Invalid email type', 400

        # Create the CSV data
        si = StringIO()
        writer = csv.writer(si)
        writer.writerow(['S/N', 'Email Text', 'Time Detected'])  # Header row
        
        for i, email in enumerate(emails, 1):
            writer.writerow([
                i,
                email.text,
                email.time_detected.strftime('%Y-%m-%d %H:%M:%S')
            ])

        output = si.getvalue()
        si.close()

        # Create the response with proper headers
        response = make_response(output)
        response.headers["Content-Disposition"] = f"attachment; filename={email_type}_emails.csv"
        response.headers["Content-type"] = "text/csv"
        
        return response

    except Exception as e:
        return str(e), 500



# running the app with datbase creation
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)