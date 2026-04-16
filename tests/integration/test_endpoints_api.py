def test_endpoints_crud_and_pagination(client, auth_headers) -> None:
    create_response = client.post(
        "/endpoints",
        headers=auth_headers,
        json={
            "name": "Demo API",
            "url": "https://example.com/health",
            "method": "GET",
            "check_interval": 30,
            "is_active": True,
        },
    )
    assert create_response.status_code == 201
    endpoint_id = create_response.json()["id"]

    list_response = client.get("/endpoints?skip=0&limit=10", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    update_response = client.put(
        f"/endpoints/{endpoint_id}",
        headers=auth_headers,
        json={
            "name": "Demo API Updated",
            "url": "https://example.com/ready",
            "method": "POST",
            "check_interval": 45,
            "is_active": False,
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["method"] == "POST"

    delete_response = client.delete(f"/endpoints/{endpoint_id}", headers=auth_headers)
    assert delete_response.status_code == 204
