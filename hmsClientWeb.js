const axios = require("axios")

class HMSClientWeb {

    constructor(authToken) {
        this.authToken = authToken
        this.instance = axios.create({
            baseURL: "https://api.100ms.live/v2",
            headers: {
                "Authorization": `Bearer ${'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MDEwMzgzMTIsImV4cCI6MTcwMTEyNDcxMiwianRpIjoiand0X25vbmNlIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3MDEwMzgzMTIsImFjY2Vzc19rZXkiOiI2NTU3OWJjZTY4MTExZjZmZTRiNTdlNDIifQ.JUW9P1UAvUC0neeJzSrOl21LxjWHQdEAIfFkRjG6bxM'}`
            }
        })
    }

    getRooms(options) {
        return this.instance.get("/rooms", { params: options }).then(response => response.data.data)

    }
}
module.exports = HMSClientWeb