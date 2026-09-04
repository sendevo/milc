import React from "react";
import { useNavigate } from "react-router-dom";
import Error from "../pages/Error";

const ErrorBoundaryWithNavigate = (props) => {
    const navigate = useNavigate();
    return <ErrorBoundary {...props} navigate={navigate}/>;
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorInfo: null, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        const errorLog = {
            error: {
                name: error?.name || "Error",
                message: error?.message || String(error),
                stack: error?.stack || null,
            },
            componentStack: errorInfo?.componentStack || null,
            timestamp: new Date().toISOString(),
            location: window.location.href,
            userAgent: navigator.userAgent,
            screen: {
                width: window.innerWidth,
                height: window.innerHeight,
                pixelRatio: window.devicePixelRatio,
            },
        };

        localStorage.setItem(
            "errorLog",
            JSON.stringify(errorLog)
        );

        this.setState({
            errorInfo,
            error,
        });
    }

    resetErrorBoundary = () => {
        this.setState({ hasError: false, errorInfo: null, error: null });
    }

    handleReset = () => {
        this.resetErrorBoundary();
        this.props.navigate("/");
    }

    render() {
        if (this.state.hasError) {
            return (
                <Error 
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    onReset={this.handleReset} />
            );
        }
        return this.props.children;
    }
};

export default ErrorBoundaryWithNavigate;