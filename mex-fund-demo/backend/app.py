from flask import Flask, jsonify
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    @app.get("/api/hello")
    def hello():
        return jsonify({"message": "Hello Student!"})

    @app.get("/")
    def root():
        return jsonify({"status": "MEX FUND API running"})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)


