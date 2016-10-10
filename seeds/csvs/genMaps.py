from ast import literal_eval
from csv import DictReader
import csv

dbs = ['alerts_feed','convos','pwresets','client_closeout_surveys','department_supervisors','knex_migrations_lock','tag_relations','clients','departments','msgs','tags','cms','notifications','template_use','color_tags','group_members','organization_owners','templates','commconns','groups','orgs','comms','ibm_sentiment_analysis','phone_numbers']

def parse_value(key, value):
    try:
        return literal_eval(value)
    except Exception:
        # If that doesn't work, assume it's an unquoted string
        return value

for db in dbs:
    values = []
    with open(db + ".csv") as f:
        # QUOTE_NONE: don't process quote characters, to avoid the value
        # `"2"` becoming the int `2`, rather than the string `'2'`.
        for row in DictReader(f, quoting=csv.QUOTE_ALL):
            values.append({k: parse_value(k, v) for k, v in row.iteritems()})
    print values


