import requests

url = "https://www.fotmob.com/api/matches?date=2025-08-16"
res = requests.get(url).json()

for match in res['leagues'][0]['matches'][:5]:
    print(match['home']['name'], "vs", match['away']['name'], "-", match['status']['text'])
