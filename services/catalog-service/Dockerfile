# Use a real, official Go tag that meets the >= 1.24 requirement.
FROM golang:1.24-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy module files first to leverage Docker cache
COPY go.* ./
RUN go mod download

# Install the Air tool using its new, official path
RUN go install github.com/air-verse/air@latest

# Copy the rest of the source code
COPY . .

# Build the application once to ensure it's valid
RUN CGO_ENABLED=0 go build -o /app/catalog-service-binary .

# --- Second Stage: Final Image ---

# Use the same updated Go base image for the final development stage
FROM golang:1.24-alpine

WORKDIR /app

# Copy all built artifacts and source code from the builder stage
COPY --from=builder /app .
# Also copy the Air binary from the builder's GOPATH
COPY --from=builder /go/bin/air /usr/local/bin/

# Expose the port our service listens on
EXPOSE 8082

# The new command to run the application using Air
CMD ["air"]