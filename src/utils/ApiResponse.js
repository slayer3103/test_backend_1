class ApiResponse extends Response {
    constructor(
        data,
        message = 'success',
        statusCode
    ) {
        super(message),
        this.data = data,
            this.message = message,
            this.success = true,
            this.statusCode = statusCode < 400
    }
}

export { ApiResponse }