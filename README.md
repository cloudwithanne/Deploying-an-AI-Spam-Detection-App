# Deployment of an AI Spam Detection App

## Overview
This will walk you through the steps to set up and deploy an AI spam detection application on an AWS EC2 instance. This app was written in Python (Flask). The app will run on a production-ready server using Gunicorn.

---

## Prerequisites

1. **AWS Account**
2. **An existing EC2 instance** running Ubuntu.
3. **Basic knowledge** of terminal commands.
4. **A configured security group** for your EC2 instance.

---

## Step 1: Launch the Ubuntu EC2 Instance

1. Log in to your AWS Management Console
2. Navigate to the **EC2 Dashboard**
3. Click **Launch Instance**
4. Select an **Ubuntu Server AMI** (e.g., Ubuntu 20.04 LTS)
5. Choose an **Instance Type** (e.g., t2.micro for free tier)
6. Create a key pair (.pem)
7. Configure security groups:
   - Allow SSH (port 22)
   - Add a rule for HTTP (port 80)
8. Launch the instance and connect via SSH

---

## Step 2: Update the Instance

Run the following commands to update your instance:

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Step 3: Install Python and Pip

Install Python and Pip:

```bash
sudo apt install python3-pip -y
```

Verify the installation:

```bash
python3 --version
pip --version
```

---

## Step 4: Set Up the Flask App

1. Clone your Flask app repository: [Here's my repo](./SpamEmail)

```bash
git clone <repository-url>
```

2. Navigate to the project folder (in my case *spamemail*):

```bash
ls
cd <folder-name>
ls
```

3. Check the `requirements.txt` file:

```bash
nano requirements.txt
```

4. If you can't access the requirements.txt file (if it looks encrypted), most likely the file was created on a Windows systems which uses a CRLF (\r\n) for line endings. However, running this on a Linux server will require the file to use a Unix-style line endings. In this case, we have to convert using the following commands:

```bash
file requirements.txt
sudo apt install dos2unix -y
dos2unix requirements.txt
```

5. Install the dependencies:

```bash
pip install -r requirements.txt
```

---

## Step 5: Run the Flask App (Development Mode)

Start the app:

```bash
python3 app.py
```

Verify the app is running by navigating to `http://<your-ec2-public-ip>:5000` in your browser.

---

## Step 6: Open Port 5000 (this is the port the app is running on) in the Security Group, this will enable the app to run

1. Go to the **EC2 Dashboard** in AWS.
2. Select your instance and go to the **Security** tab.
3. Edit the **Inbound Rules** of your security group to allow TCP traffic on port 5000.

---

## Step 7: The app is currently running on the Flask's development server. To set up a production-ready server that can efficiently manage traffic to your app, you will need to run it on Gunicorn (optional if you're just testing)

1. Install Gunicorn:

```bash
pip install gunicorn
```

2. Run the app with Gunicorn:

```bash
gunicorn --workers 3 --bind 0.0.0.0:5000 app:app
```

Replace `app:app` with your actual module and app name if different.


This concludes the setup for deploying your AI Spam detection application on AWS EC2!

[Check out the screenshot of what the app looks like](./The-AI-Spam-Detection-App-(running))
