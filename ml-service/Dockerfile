FROM python:3.14-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Generate gRPC stubs from the proto definition
COPY fraud_detection.proto .
RUN python -m grpc_tools.protoc \
    -I. \
    --python_out=. \
    --grpc_python_out=. \
    fraud_detection.proto

# Copy model artifact and application code
COPY model/ ./model/
COPY main.py grpc_server.py ./

EXPOSE 8000 50051

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
