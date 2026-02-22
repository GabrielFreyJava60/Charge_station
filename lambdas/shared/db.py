"""DynamoDB helper utilities for Lambda functions."""

import os
import boto3
from boto3.dynamodb.conditions import Key, Attr


def _get_endpoint():
    endpoint = os.environ.get("DYNAMODB_ENDPOINT")
    return endpoint if endpoint else None


def get_dynamodb_resource():
    kwargs = {"region_name": os.environ.get("AWS_REGION_NAME", "us-east-1")}
    endpoint = _get_endpoint()
    if endpoint:
        kwargs["endpoint_url"] = endpoint
    return boto3.resource("dynamodb", **kwargs)


def get_table(table_env_var):
    """Get a DynamoDB table by environment variable name."""
    table_name = os.environ.get(table_env_var)
    if not table_name:
        raise ValueError(f"Environment variable {table_env_var} not set")
    db = get_dynamodb_resource()
    return db.Table(table_name)


def get_stations_table():
    return get_table("STATIONS_TABLE")


def get_sessions_table():
    return get_table("SESSIONS_TABLE")


def get_users_table():
    return get_table("USERS_TABLE")


def get_error_logs_table():
    return get_table("ERROR_LOGS_TABLE")


def put_item(table, item):
    """Put an item into a DynamoDB table."""
    table.put_item(Item=item)
    return item


def put_item_conditional(table, item, condition_expression):
    """Put an item with a condition (for optimistic locking)."""
    table.put_item(Item=item, ConditionExpression=condition_expression)
    return item


def get_item(table, pk, sk):
    """Get a single item by PK and SK."""
    response = table.get_item(Key={"PK": pk, "SK": sk})
    return response.get("Item")


def query_pk(table, pk, sk_prefix=None):
    """Query all items with a given PK, optionally filtered by SK prefix."""
    if sk_prefix:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with(sk_prefix)
        )
    else:
        response = table.query(KeyConditionExpression=Key("PK").eq(pk))
    return response.get("Items", [])


def query_gsi(table, index_name, pk_attr, pk_value, sk_attr=None, sk_value=None, limit=None, scan_forward=True):
    """Query a GSI with optional sort key and limit."""
    key_condition = Key(pk_attr).eq(pk_value)
    if sk_attr and sk_value:
        key_condition = key_condition & Key(sk_attr).eq(sk_value)

    kwargs = {
        "IndexName": index_name,
        "KeyConditionExpression": key_condition,
        "ScanIndexForward": scan_forward,
    }
    if limit:
        kwargs["Limit"] = limit

    response = table.query(**kwargs)
    return response.get("Items", [])


def update_item(table, pk, sk, update_expr, expr_attr_values, expr_attr_names=None, condition_expression=None):
    """Update an item with an update expression."""
    kwargs = {
        "Key": {"PK": pk, "SK": sk},
        "UpdateExpression": update_expr,
        "ExpressionAttributeValues": expr_attr_values,
        "ReturnValues": "ALL_NEW",
    }
    if expr_attr_names:
        kwargs["ExpressionAttributeNames"] = expr_attr_names
    if condition_expression:
        kwargs["ConditionExpression"] = condition_expression
    response = table.update_item(**kwargs)
    return response.get("Attributes")


def delete_item(table, pk, sk):
    """Delete an item by PK and SK."""
    table.delete_item(Key={"PK": pk, "SK": sk})


def scan_table(table, filter_expression=None, limit=None):
    """Scan an entire table with optional filter."""
    kwargs = {}
    if filter_expression:
        kwargs["FilterExpression"] = filter_expression
    if limit:
        kwargs["Limit"] = limit
    response = table.scan(**kwargs)
    return response.get("Items", [])
