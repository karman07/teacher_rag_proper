import httpx
import asyncio

async def main():
    url = "https://ai-backend-66976dwa2.brevlab.com/ingest"
    files = {'file': ('test.txt', b'hello world', 'text/plain')}
    data = {
        'teacher_id': 't',
        'collection_name': 'c',
        'file_id': 'f',
        'file_name': 'n',
        'is_assignment': 'undefined'
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, data=data, files=files)
        print("Status:", resp.status_code)
        print("Response:", resp.text)

asyncio.run(main())
