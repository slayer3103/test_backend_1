class ApiResponse extends Response {
    constructor(
        data,
        message = 'success',
        statusCode
    ) {
        this.data=data,
        this.message =message,
        this.success=true,
        this.statusCode=statusCode<400
    }
}