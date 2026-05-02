with open(r"D:\Documents\School\CS430\CS430Group2\Front\front-app\src\views\LaunchScanner.jsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("'Authorization': \`Bearer ` + '${token}' + `\`,", "'Authorization': `Bearer ${token}`,")
content = content.replace(r"'Authorization': \Bearer  + '' + \,", "'Authorization': `Bearer ${token}`,")

with open(r"D:\Documents\School\CS430\CS430Group2\Front\front-app\src\views\LaunchScanner.jsx", "w", encoding="utf-8") as f:
    f.write(content)
