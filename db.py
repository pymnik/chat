import psycopg2
import os
import sqlalchemy

# conn = psycopg2.connect(dbname='db_vuci', user='db_vuci_user', password=os.environ.get('DATABASE_PASSWORD'), host=os.environ.get('DATABASE_URL'), port=5432)
conn = psycopg2.connect(os.environ.get("DATABASE_URL"))
cur = conn.cursor()

# with psycopg2.connect(os.environ.get('DATABASE_URL'))

cur.execute("CREATE TABLE IF NOT EXISTS USERS(id serial primary key, username text);")
cur.execute("CREATE TABLE IF NOT EXISTS CHATS(id serial primary key, user1 INTEGER REFERENCES USERS(id), user2 INTEGER REFERENCES USERS(id));")
cur.execute("CREATE TABLE IF NOT EXISTS MESSAGES(id serial primary key, userid INTEGER REFERENCES USERS(id), chatid INTEGER REFERENCES CHATS(id));")
conn.commit()