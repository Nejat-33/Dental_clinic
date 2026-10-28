
import httpx
import json

BASE_URL = "http://127.0.0.1:4000/api"


def main():
    endpoints = ["/health", "/services"]

    with httpx.Client(timeout=10.0) as client:
        for endpoint in endpoints:
            print(f"\n{'=' * 50}")
            print(f"Testing: {endpoint}")
            print("=" * 50)

            try:
                response = client.get(f"{BASE_URL}{endpoint}")
                response.raise_for_status()

                try:
                    data = response.json()
                    print(json.dumps(data, indent=2))
                except ValueError:
                    print(response.text)

            except httpx.HTTPError as exc:
                print(f"Request failed: {exc}")


if __name__ == "__main__":
    main()
