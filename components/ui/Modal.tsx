'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, XCircle, AlertTriangle, Gift, Scissors, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM MODAL COMPONENT - Barber Shop Aesthetic
// ═══════════════════════════════════════════════════════════════════════════

export type ModalType = 'confirm' | 'success' | 'error' | 'warning' | 'redeem'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    type?: ModalType
    title: string
    message?: string
    confirmText?: string
    cancelText?: string
    onConfirm?: (e?: React.MouseEvent) => void
    icon?: React.ReactNode
    children?: React.ReactNode
    hideButtons?: boolean
    isLoading?: boolean
}

// Animation variants
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
}

const modalVariants = {
    hidden: {
        opacity: 0,
        scale: 0.8,
        y: 20,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            damping: 25,
            stiffness: 300,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        y: 20,
        transition: {
            duration: 0.2,
        },
    },
}

// Icon configurations by type
const iconConfig = {
    confirm: {
        icon: AlertTriangle,
        bgClass: 'bg-amber-500/20',
        iconClass: 'text-amber-400',
    },
    success: {
        icon: CheckCircle2,
        bgClass: 'bg-emerald-500/20',
        iconClass: 'text-emerald-400',
    },
    error: {
        icon: XCircle,
        bgClass: 'bg-red-500/20',
        iconClass: 'text-red-400',
    },
    warning: {
        icon: AlertTriangle,
        bgClass: 'bg-amber-500/20',
        iconClass: 'text-amber-400',
    },
    redeem: {
        icon: Gift,
        bgClass: 'bg-primary/20',
        iconClass: 'text-primary',
    },
}

export function Modal({
    isOpen,
    onClose,
    type = 'confirm',
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    icon,
    children,
    hideButtons = false,
    isLoading = false,
}: ModalProps) {
    // Handle ESC key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) {
                onClose()
            }
        },
        [onClose, isLoading]
    )

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, handleKeyDown])

    const config = iconConfig[type]
    const IconComponent = config.icon

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-md"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Glass morphism card */}
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 shadow-2xl shadow-black/50">
                            {/* Decorative gradient line at top */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Content */}
                            <div className="p-6 pt-8">
                                {/* Icon */}
                                <div className="flex justify-center mb-5">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', delay: 0.1 }}
                                        className={`p-4 rounded-full ${config.bgClass}`}
                                    >
                                        {icon || <IconComponent className={`w-8 h-8 ${config.iconClass}`} />}
                                    </motion.div>
                                </div>

                                {/* Title */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="text-xl font-bold text-center text-white mb-2"
                                >
                                    {title}
                                </motion.h2>

                                {/* Message */}
                                {message && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-center text-zinc-400 mb-6"
                                    >
                                        {message}
                                    </motion.p>
                                )}

                                {/* Custom children */}
                                {children && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="mb-6"
                                    >
                                        {children}
                                    </motion.div>
                                )}

                                {/* Buttons */}
                                {!hideButtons && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                        className="flex gap-3"
                                    >
                                        {type === 'success' || type === 'error' ? (
                                            // Single button for feedback modals
                                            <Button
                                                onClick={onClose}
                                                disabled={isLoading}
                                                className={`flex-1 h-12 font-semibold text-base rounded-xl ${type === 'success'
                                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                    : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                                                    }`}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    confirmText || 'Got it'
                                                )}
                                            </Button>
                                        ) : (
                                            // Two buttons for confirmation modals
                                            <>
                                                <Button
                                                    onClick={onClose}
                                                    disabled={isLoading}
                                                    variant="outline"
                                                    className="flex-1 h-12 font-semibold text-base rounded-xl border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300"
                                                >
                                                    {cancelText}
                                                </Button>
                                                <Button
                                                    onClick={onConfirm}
                                                    disabled={isLoading}
                                                    className="flex-1 h-12 font-semibold text-base rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black shadow-lg shadow-amber-500/25"
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        confirmText
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            {/* Decorative scissors icon at bottom */}
                            <div className="absolute -bottom-6 -right-6 opacity-5">
                                <Scissors className="w-24 h-24 text-white rotate-45" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK FOR EASY MODAL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'

interface UseModalOptions {
    type?: ModalType
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
}

export function useModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [options, setOptions] = useState<UseModalOptions>({})

    const open = (opts: UseModalOptions) => {
        setOptions(opts)
        setIsOpen(true)
    }

    const close = () => {
        setIsOpen(false)
    }

    const confirm = (title: string, message?: string): Promise<boolean> => {
        return new Promise((resolve) => {
            open({
                type: 'confirm',
                title,
                message,
                onConfirm: () => resolve(true),
            })
            // If closed without confirming, we don't resolve (modal closed via close button)
        })
    }

    const success = (title: string, message?: string) => {
        open({
            type: 'success',
            title,
            message,
            confirmText: 'Awesome!',
        })
    }

    const error = (title: string, message?: string) => {
        open({
            type: 'error',
            title,
            message,
            confirmText: 'Close',
        })
    }

    const redeem = (title: string, message?: string, onConfirm?: () => void) => {
        open({
            type: 'redeem',
            title,
            message,
            confirmText: 'Redeem Now',
            cancelText: 'Not Now',
            onConfirm,
        })
    }

    return {
        isOpen,
        options,
        open,
        close,
        confirm,
        success,
        error,
        redeem,
        Modal: (
            <Modal
                isOpen={isOpen}
                onClose={close}
                type={options.type}
                title={options.title || ''}
                message={options.message}
                confirmText={options.confirmText}
                cancelText={options.cancelText}
                onConfirm={options.onConfirm}
            />
        ),
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIALIZED REDEMPTION MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface RedeemModalProps {
    isOpen: boolean
    onClose: () => void
    clientName: string
    points: number
    redeemAmount: number
    rewardName: string
    onConfirm: () => void
}

export function RedeemModal({
    isOpen,
    onClose,
    clientName,
    points,
    redeemAmount,
    rewardName,
    onConfirm,
}: RedeemModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            type="redeem"
            title="Canjear Premio"
            confirmText="Confirmar Canje"
            cancelText="Cancelar"
            onConfirm={onConfirm}
        >
            <div className="space-y-4">
                {/* Client info */}
                <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                    <div className="text-sm text-zinc-400 mb-1">Cliente</div>
                    <div className="text-lg font-semibold text-white">{clientName}</div>
                </div>

                {/* Redemption details */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-center">
                        <div className="text-sm text-zinc-400 mb-1">Puntos Actuales</div>
                        <div className="text-2xl font-bold text-primary">{points}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                        <div className="text-sm text-zinc-400 mb-1">A Canjear</div>
                        <div className="text-2xl font-bold text-red-400">-{redeemAmount}</div>
                    </div>
                </div>

                {/* Reward */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 text-center">
                    <div className="text-sm text-amber-400/80 mb-1">Premio</div>
                    <div className="text-lg font-bold text-amber-400 flex items-center justify-center gap-2">
                        <Gift className="w-5 h-5" />
                        {rewardName}
                    </div>
                </div>

                {/* Balance after */}
                <div className="text-center text-sm text-zinc-400">
                    Balance después del canje:{' '}
                    <span className="font-semibold text-white">{points - redeemAmount} puntos</span>
                </div>
            </div>
        </Modal>
    )
}
