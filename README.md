
do this as we also have .env issues in backend

node src/index.js



working---===---
curl -X POST http://localhost:5000/api/files/upload -F "file=@/d/ShivamKapriCV/SHIVAM KAPRI.pdf" -F "uploader=smck"

curl http://localhost:5000/api/files/

curl "http://localhost:5000/api/files/download/SHIVAM%20KAPRI.pdf"



curl -X DELETE "http://localhost:5000/api/files/SHIVAM%20KAPRI.pdf" \
  -H "Content-Type: application/json" \
  -d '{"adminPassword": "admin123"}'
  