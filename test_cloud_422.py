import httpx
import asyncio

async def main():
    url = "https://ai-backend-66976dwa2.brevlab.com/ingest"
    
    files = {'file': ('test.txt', b'hello world', 'text/plain')}
    data = {
        'teacher_id': 'd2f808b8-34e7-447c-b2ec-65f7fc33864e',
        'collection_name': 'test_collection',
        'file_id': 'test_file_id',
        'file_name': 'test.txt',
        'is_assignment': 'false'
    }
    
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(url, data=data, files=files)
            print("Status:", resp.status_code)
            print("Response:", resp.text)
        except Exception as e:
            print("Error:", e)

asyncio.run(main())
