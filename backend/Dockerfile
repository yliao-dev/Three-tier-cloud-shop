# Dockerfile

# Use an official Go image as the build stage
FROM golang:1.23-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum files to download dependencies
COPY go.mod ./
# If you had dependencies, you would run go mod download here

# Copy the source code
COPY *.go ./

# Build the Go application
# CGO_ENABLED=0 is important for a static binary, making it portable
# -o /app/main creates the binary named 'main' in the /app directory
RUN CGO_ENABLED=0 go build -o /app/main .

# --- Second Stage: Final Image ---

# Use a minimal, non-root base image for the final container
FROM alpine:latest

# Set the working directory
WORKDIR /app

# Copy the built binary from the 'builder' stage
COPY --from=builder /app/main .

# Expose the port the app runs on
EXPOSE 8080

# The command to run the application
CMD ["/app/main"]