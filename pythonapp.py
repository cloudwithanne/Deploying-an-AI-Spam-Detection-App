from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "Welcome to your DevOps Course!"

@app.route('/about')
def about():
    return "This is a beginner-friendly course that build your understanding of DevOps"

@app.route('/tutor')
def tutor():
    return "I am Anne Usang and I am pleased to take you on this course"

if __name__ == '__main__':
    app.run(debug=True, port=4000)
