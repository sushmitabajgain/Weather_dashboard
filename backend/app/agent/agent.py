import os
from dotenv import load_dotenv
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_groq import ChatGroq

load_dotenv()

AQHI_CONTEXT = """You are an expert AQHI (Air Quality Health Index) data analyst for a \
Canadian air quality dashboard.

Database table: aqhi_data
Columns:
  - location_name  : Canadian city / monitoring station name
  - longitude      : geographic longitude
  - latitude       : geographic latitude
  - aqhi           : numeric AQHI value (<=3 Low, 4-6 Moderate, 7-10 High, >10 Very High)
  - category       : Low | Moderate | High | Very High | Unknown
  - datetime       : timestamp of the measurement or forecast
  - dataset_type   : 'Forecast' or 'Observation'

Guidelines:
- Answer in plain English and explain AQHI values in terms of health implications.
- Round averages to 2 decimal places.
- When comparing locations, rank them clearly.
- Always specify whether results are from Forecast or Observation data if relevant.
- Never return SQL queries, code blocks, raw database errors, or query-debugging steps to the user.
- If the exact request cannot be answered, say so briefly and suggest 1-2 alternative questions in plain English.
- If a date or filter seems unavailable, suggest a nearby or broader question instead of attempting to repair SQL in the final answer.
- Keep answers concise, helpful, and user-facing.
"""

_agent = None


def get_agent():
    """Return the lazily initialised SQL agent."""
    global _agent
    if _agent is not None:
        return _agent

    db_url = (
        f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    )

    db = SQLDatabase.from_uri(
        db_url,
        include_tables=["aqhi_data"],
        sample_rows_in_table_info=3,
    )

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY"),
    )

    _agent = create_sql_agent(
        llm=llm,
        db=db,
        agent_type="tool-calling",
        verbose=True,
        prefix=AQHI_CONTEXT,
    )

    return _agent
