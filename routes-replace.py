import sys
import json 
import re 

data = sys.stdin.read().strip()

data = data.replace("function (req, res) {", "(req, res) => {")
data = re.sub(r"(router\.(get|post)\(\")", r"\1/" + sys.argv[1], data)
data = data.replace("primaryUser", "primary")
data = data.replace("req.params.userID", "req.user.cmid")
data = data.replace("req.params.orgID", "req.user.org")
data = data.replace("var ", "let ")
data = data.replace("const ", "let ")
data = data.replace("$\{req.redirectUrlBase\}", "/v4")

print data

# cat ./routes/versionFour/roles/primary/templates.js | python routes-replace.py templates