import subprocess


def build():
    print("Building FastAPI Docker image...")
    subprocess.run(["docker", "build", "-t", "lms-api:dev", "."], check=True)
    print("Building Opensearch Docker image...")
    subprocess.run(["docker", "build", "-t", "lms-search:dev", "-f", "Dockerfile.search", "."], check=True)


def build_frontend():
    print("Building frontend Docker image...")
    # docker build -t lms-frontend:dev -f dockerfile.frontend . --no-cache
    subprocess.run(
        ["docker", "build", "-t", "lms-frontend:dev", "-f", "Dockerfile.frontend", ".", "--no-cache"], check=True
    )
    print("Frontend Docker image has been built.")