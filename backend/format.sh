#!/bin/bash
# Backend formatting and linting script

echo "Running isort..."
python -m isort .

echo "Running Black..."
python -m black .

echo "Running flake8..."
python -m flake8 .

echo "Backend code formatting and linting complete!"