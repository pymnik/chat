import psycopg2
import os
import sqlalchemy

conn = psycopg2.connect(dbname='db_vuci', user='db_vuci_user', password=os.environ.get('DATABASE_PASSWORD'), host=os.environ.get('DATABASE_URL'), port=5432)
cur = conn.cursor()

# with psycopg2.connect(os.environ.get('DATABASE_URL'))

cur.execute("CREATE TABLE IF NOT EXIST USERS(id serial primary key, username text);")
cur.execute("CREATE TABLE IF NOT EXIST CHATS(id serial primary key, user1 int references USERS(id), user2 int references USERS(id);")
cur.execute("CREATE TABLE IF NOT EXIST MESSAGES(id serial primary key, userid int references USERS(id), chatid int referenes CHATS(id));")
conn.commit()