currently what is there I have to enter my password again and again and then I can delete a file what I want is once I have entered the password I can delete file any time      also what I want is that I can be able to delete more than one file at a time like something must be they like i can select more than 1 file




cd frontend  npm start
cd backend npm start
do this as we also have .env issues in backend

node src/index.js



working---===---
curl -X POST http://localhost:5000/api/files/upload -F "file=@/d/ShivamKapriCV/SHIVAMKAPRI.pdf" -F "uploader=smck"

curl http://localhost:5000/api/files/

curl "http://localhost:5000/api/files/download/SHIVAM%20KAPRI.pdf"



curl -X DELETE "http://localhost:5000/api/files/SHIVAMKAPRI.pdf" \
  -H "Content-Type: application/json" \
  -d '{"adminPassword": "admin123"}'
  