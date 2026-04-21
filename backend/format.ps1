# Backend formatting and linting script for Windows

Write-Host "Running isort..." -ForegroundColor Blue
python -m isort .

Write-Host "Running Black..." -ForegroundColor Blue  
python -m black .

Write-Host "Running flake8..." -ForegroundColor Blue
python -m flake8 .

Write-Host "Backend code formatting and linting complete!" -ForegroundColor Green