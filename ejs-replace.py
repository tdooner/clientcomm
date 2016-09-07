import sys
import re 


data = sys.stdin.read().strip()

data = data.replace("users/<%=user.cmid%>/primary/", "")
print data