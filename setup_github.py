# -*- coding: utf-8 -*-
import sys, urllib.request, json
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

TOKEN = input("GitHub token: ").strip()
REPO = "eduard03072000-png/CardAI"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28"
}

data = {
    "description": "🤖 AI-генератор карточек товаров для Wildberries, Ozon и Авито — заголовок, описание, SEO-ключи и Excel за 30 секунд",
    "homepage": "http://198.13.184.39",
    "topics": ["nextjs", "typescript", "ai", "wildberries", "ozon", "marketplace", "seo", "groq", "ecommerce", "russia"],
    "has_issues": True,
    "has_projects": False,
    "has_wiki": False,
}

req = urllib.request.Request(
    f"https://api.github.com/repos/{REPO}",
    data=json.dumps({"description": data["description"], "homepage": data["homepage"]}).encode(),
    headers=headers,
    method="PATCH"
)
resp = urllib.request.urlopen(req)
print("Repo updated:", resp.status)

# Topics
req2 = urllib.request.Request(
    f"https://api.github.com/repos/{REPO}/topics",
    data=json.dumps({"names": data["topics"]}).encode(),
    headers={**headers, "Accept": "application/vnd.github.mercy-preview+json"},
    method="PUT"
)
resp2 = urllib.request.urlopen(req2)
print("Topics updated:", resp2.status)
print("Done!")
