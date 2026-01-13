class ApiError extends Error {
    constructor(
        stack = '',
        errors = [],
        message = 'something went wrong',
        statusCode
    ) {
        super(message)
        this.statusCode = statusCode,
            this.success = false,
            this.errors = errors,
            this.message = message,
            this.data = null

        if (stack) {
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this, this.constructor)

        }
    }
}

export {ApiError}