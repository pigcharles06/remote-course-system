import requests

BASE_URL = "http://localhost:8000/api"

def login(email, password):
    res = requests.post(f"{BASE_URL}/token", data={"username": email, "password": password})
    return res.json()["access_token"]

def test_flow():
    # 1. Login as Admin
    print("Logging in as Admin...")
    admin_token = login("admin@example.com", "adminpassword")
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 2. Get Applications
    print("Fetching applications...")
    apps = requests.get(f"{BASE_URL}/applications/", headers=headers_admin).json()
    if not apps:
        print("No applications found. Please create one first.")
        return
    app_id = apps[0]["id"]
    print(f"Selected Application ID: {app_id}")

    # 3. Get Reviewers
    print("Fetching reviewers...")
    reviewers = requests.get(f"{BASE_URL}/users/reviewers", headers=headers_admin).json()
    if not reviewers:
        print("No reviewers found.")
        return
    reviewer_id = reviewers[0]["id"]
    print(f"Selected Reviewer ID: {reviewer_id}")

    # 4. Assign Reviewer
    print("Assigning reviewer...")
    review_data = {"application_id": app_id, "reviewer_id": reviewer_id}
    review = requests.post(f"{BASE_URL}/reviews/", json=review_data, headers=headers_admin).json()
    review_id = review["id"]
    print(f"Review Created. ID: {review_id}")

    # 5. Login as Reviewer
    print("Logging in as Reviewer...")
    reviewer_token = login("reviewer@example.com", "reviewerpassword")
    headers_reviewer = {"Authorization": f"Bearer {reviewer_token}"}

    # 6. Get Assigned Reviews
    print("Fetching assigned reviews...")
    my_reviews = requests.get(f"{BASE_URL}/reviews/me", headers=headers_reviewer).json()
    found = False
    for r in my_reviews:
        if r["id"] == review_id:
            found = True
            break
    if not found:
        print("Error: Assigned review not found in reviewer's list.")
        return
    print("Review found in reviewer's list.")

    # 7. Get Application Details (as Reviewer)
    print("Fetching application details as Reviewer...")
    app_details = requests.get(f"{BASE_URL}/applications/{app_id}", headers=headers_reviewer).json()
    print(f"Application Name: {app_details['course_name_zh']}")

    # 8. Submit Review
    print("Submitting review...")
    update_data = {"result": "PASSED", "comments": "Great course!"}
    updated_review = requests.put(f"{BASE_URL}/reviews/{review_id}", json=update_data, headers=headers_reviewer).json()
    
    if updated_review["status"] == "COMPLETED":
        print("Review submitted successfully. Status: COMPLETED")
    else:
        print(f"Error: Review status is {updated_review['status']}")

if __name__ == "__main__":
    test_flow()
