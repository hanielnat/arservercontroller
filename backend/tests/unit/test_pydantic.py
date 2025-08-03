import datetime
import os
import random
from logging import Logger
from typing import Optional

import pydantic
from arservercontroller.services.logger import get_logger

test_logger: Logger = get_logger(__name__)


class TestData(pydantic.BaseModel):
    id: int
    name: str
    time: datetime.time


class Nested(pydantic.BaseModel):
    id: int
    name: Optional[str] = None
    test_data: Optional[TestData] = None


def test_json_validation():
    result: str
    random_id: int

    random_id = random.randint(0, 1000)
    test_data_type: TestData = TestData(
        id=random_id, name="name", time=datetime.datetime.now().time()
    )

    test_logger.info(test_data_type)
    result = test_data_type.model_dump_json()
    test_logger.info("result: str = %s", result)

    random_id = random.randint(0, 1000)
    nested_type: Nested = Nested(id=random_id)

    test_logger.info(nested_type)
    result = nested_type.model_dump_json()
    test_logger.info("result: str = %s", result)

    random_id = random.randint(0, 1000)
    nested_type = Nested(id=random_id, test_data=test_data_type)

    test_logger.info(nested_type)
    result = nested_type.model_dump_json()
    test_logger.info("result: str = %s", result)

    assert hasattr(nested_type, "test_data")

    test_json_file: str = "tests/testFile.json"

    with open(file=test_json_file, mode="w", encoding="utf-8") as file:
        nested_type = Nested(id=random_id, name="test_name", test_data=test_data_type)
        result = nested_type.model_dump_json()
        file.write(result)
        assert file.tell() >= 0

    nested_type = Nested(id=1)
    result = ""

    with open(file=test_json_file, mode="r") as file:
        try:
            result = file.read()
            nested_type = nested_type.model_validate_json(result)
        except pydantic.ValidationError as e:
            test_logger.error(e)
        assert file.tell() >= 0

    if os.path.exists(path=test_json_file):
        os.remove(path=test_json_file)
