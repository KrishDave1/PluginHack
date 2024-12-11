# Use Python 3.10 image
FROM python:3.10

# Set the working directory
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your project files
COPY . /app/

# Expose the port that Django uses
EXPOSE 8000

# Run your app using Django's development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
