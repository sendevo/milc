import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";

const ModalContext = createContext(null);

const DEFAULT_MODAL_STATE = {
    open: false,
    title: "",
    content: null,
    actions: [],
    onClose: null,
    disableClose: false,
    maxWidth: "sm",
    fullWidth: true,
    formValues: {},
};

const resolveInputValue = (eventOrValue) => {
    if (eventOrValue && typeof eventOrValue === "object" && "target" in eventOrValue) {
        const { target } = eventOrValue;
        if (target?.type === "checkbox") return Boolean(target.checked);
        return target?.value;
    }
    return eventOrValue;
};

export const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(DEFAULT_MODAL_STATE);

    const closeModal = useCallback((reason = "programmatic") => {
        setModal((prev) => {
            if (typeof prev.onClose === "function") {
                prev.onClose({ reason, formValues: prev.formValues, closeModal });
            }
            return { ...DEFAULT_MODAL_STATE };
        });
    }, []);

    const openModal = useCallback((config = {}) => {
        setModal({
            ...DEFAULT_MODAL_STATE,
            ...config,
            open: true,
            formValues: config.formValues || {},
        });
    }, []);

    const updateModal = useCallback((patch = {}) => {
        setModal((prev) => ({ ...prev, ...patch }));
    }, []);

    const setFieldValue = useCallback((name, value) => {
        setModal((prev) => ({
            ...prev,
            formValues: {
                ...prev.formValues,
                [name]: value,
            },
        }));
    }, []);

    const getFieldValue = useCallback((name, fallback = "") => {
        return modal.formValues?.[name] ?? fallback;
    }, [modal.formValues]);

    const getInputProps = useCallback((name, fallback = "") => {
        return {
            value: getFieldValue(name, fallback),
            onChange: (eventOrValue) => {
                setFieldValue(name, resolveInputValue(eventOrValue));
            },
        };
    }, [getFieldValue, setFieldValue]);

    const modalApi = useMemo(() => ({
        openModal,
        closeModal,
        updateModal,
        getFieldValue,
        setFieldValue,
        getInputProps,
        formValues: modal.formValues,
    }), [openModal, closeModal, updateModal, getFieldValue, setFieldValue, getInputProps, modal.formValues]);

    const handleDialogClose = useCallback((_, reason) => {
        if (modal.disableClose && (reason === "backdropClick" || reason === "escapeKeyDown")) {
            return;
        }
        closeModal(reason || "dismissed");
    }, [closeModal, modal.disableClose]);

    const handleActionClick = useCallback(async (action) => {
        if (typeof action?.onClick === "function") {
            await action.onClick({
                ...modalApi,
                action,
            });
        }

        if (action?.autoClose !== false) {
            closeModal("action");
        }
    }, [closeModal, modalApi]);

    const renderedContent = useMemo(() => {
        if (typeof modal.content === "function") {
            return modal.content(modalApi);
        }
        return modal.content;
    }, [modal.content, modalApi]);

    return (
        <ModalContext.Provider value={modalApi}>
            {children}
            <Dialog
                open={modal.open}
                onClose={handleDialogClose}
                fullWidth={modal.fullWidth}
                maxWidth={modal.maxWidth}>
                {modal.title ? <DialogTitle>{modal.title}</DialogTitle> : null}
                <DialogContent>
                    {renderedContent}
                </DialogContent>
                {Array.isArray(modal.actions) && modal.actions.length > 0 ? (
                    <DialogActions>
                        {modal.actions.map((action, index) => (
                            <Button
                                key={`${action.label || "action"}-${index}`}
                                variant={action.variant || "text"}
                                color={action.color || "primary"}
                                disabled={Boolean(action.disabled)}
                                onClick={() => {
                                    void handleActionClick(action);
                                }}>
                                {action.label || "Action"}
                            </Button>
                        ))}
                    </DialogActions>
                ) : null}
                {modal.actions?.length === 0 && modal.disableClose ? (
                    <Box sx={{ p: 2 }} />
                ) : null}
            </Dialog>
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};
