declare global {
  interface Window {
    ethosInternal: any
  }
}

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import Loader from '../svg/Loader'
import useWindowDimensions from '../../hooks/useWindowDimensions'
import * as styles from './signInModalStyles'
import useHandleElementWithIdClicked from '../../lib/useHandleElementWithIdClicked'
import WalletContext from '../WalletContext'
import EmailSent from './EmailSent'
import Wallets from './Wallets'
import Email from './Email'
import Dialog from './Dialog'
import ModalWrapper from './ModalWrapper'

export type SignInModalProps = {
    isOpen: boolean
    onClose?: () => void
    hideEmailSignIn?: boolean
    hideWalletSignIn?: boolean
}

export function showSignInModal() {
    window.ethosInternal.showSignInModal()
}

export function hideSignInModal() {
    window.ethosInternal.hideSignInModal()
}

const SignInModal = ({
    isOpen,
    onClose,
    hideEmailSignIn,
    hideWalletSignIn,
}: SignInModalProps) => {
    const { wallets, selectWallet } = useContext(WalletContext);
    const [isOpenAll, setIsOpenAll] = useState(isOpen)
    const [signingIn, setSigningIn] = useState(false)
    
    const [emailSent, setEmailSent] = useState(false)
    const { width } = useWindowDimensions()
    const captchaRef = useRef<any | null>(null)
    const closeOnClickId = 'ethos-close-on-click'

    const _onClose = useCallback(() => {
        setIsOpenAll(false)
        onClose && onClose()
    }, [])

    useHandleElementWithIdClicked(closeOnClickId, _onClose)

    useEffect(() => {
        window.ethosInternal ||= {}

        window.ethosInternal.showSignInModal = () => {
            setIsOpenAll(true)
        }

        window.ethosInternal.hideSignInModal = () => {
            _onClose()
        }

        setIsOpenAll(isOpen)
    }, [isOpen, setIsOpenAll, _onClose])

    useEffect(() => {
        if (hideEmailSignIn && hideWalletSignIn) {
            throw new Error("hideEmailSignIn and hideWalletSignIn cannot both be true");
        }
    }, [])

    const modalContent = useMemo(() => {
        if (hideWalletSignIn) {
            return (
                <Email 
                    setSigningIn={setSigningIn}
                    setEmailSent={setEmailSent}
                    captchaRef={captchaRef}
                    width={width}
                />
            )
        }

        if (wallets) return (
            <Wallets
                wallets={wallets}
                selectWallet={selectWallet}
                width={width}
            />
        )

        return (
            <>
                <Email 
                    setSigningIn={setSigningIn}
                    setEmailSent={setEmailSent}
                    captchaRef={captchaRef}
                    width={width}
                />
                <div style={{ margin: '16px 0 16px 0' }}>
                    <span style={styles.secondaryHeaderText()}>or</span>
                </div>
            </>
        )
    }, [hideWalletSignIn, wallets])

    const loader = useMemo(() => (
        <div style={styles.loaderStyle()}>
            <Loader width={50} />
        </div>
    ), [])

    return (
        <Dialog isOpenAll={isOpenAll}>
            <ModalWrapper
                closeOnClickId={closeOnClickId}
                onClose={_onClose}
                isOpenAll={isOpenAll}
                width={width}
            >
                {emailSent ? (
                    <EmailSent />
                ) : (
                    <div style={styles.modalContent(width)}>
                        {signingIn ? loader :  modalContent}
                    </div>
                )}
            </ModalWrapper>
        </Dialog>
    )
}

export default SignInModal
