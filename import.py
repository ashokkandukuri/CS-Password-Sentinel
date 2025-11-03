import requests

url = "https://www.passwordmonster.com/"  # Replace with the website you want
response = requests.get(url)

# Print the source code (HTML) of the webpage
print(response.text)

with open("page_source.html", "w", encoding="utf-8") as f:
    f.write(response.text)
