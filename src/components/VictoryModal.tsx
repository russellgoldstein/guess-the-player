'use client';

import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import {
    FacebookShareButton,
    TwitterShareButton,
    FacebookIcon,
    TwitterIcon
} from 'react-share';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from './ui/dialog';
import { Button } from './ui/button';
import { Check, Copy, Facebook, Instagram, Trophy, Twitter } from 'lucide-react';

interface VictoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    gameId: string;
    playerName: string;
    guessCount: number;
    maxGuesses?: number;
}

const VictoryModal: React.FC<VictoryModalProps> = ({
    open,
    onOpenChange,
    gameId,
    playerName = 'the player',
    guessCount,
    maxGuesses
}) => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });
    const [copied, setCopied] = useState(false);
    const [showConfetti, setShowConfetti] = useState(true);
    const displayName = playerName || 'the player';

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);

        // Stop confetti after 5 seconds
        if (open) {
            const timer = setTimeout(() => {
                setShowConfetti(false);
            }, 5000);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', handleResize);
            };
        }

        return () => window.removeEventListener('resize', handleResize);
    }, [open]);

    // Reset confetti when modal opens
    useEffect(() => {
        if (open) {
            setShowConfetti(true);
        }
    }, [open]);

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/game/${gameId}`
        : '';

    // Don't include the player's name in the shared message to avoid spoilers
    const shareTitle = `I guessed the player in ${guessCount} ${guessCount === 1 ? 'try' : 'tries'}${maxGuesses ? ` out of ${maxGuesses}` : ''}! Can you beat me?`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareTitle + ' ' + shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareToInstagram = () => {
        // Instagram doesn't have a direct web share API, so we'll open a new window with instructions
        const text = encodeURIComponent(shareTitle + ' ' + shareUrl);
        window.open(`https://www.instagram.com/`, '_blank');

        // Copy the text to clipboard for easy pasting
        navigator.clipboard.writeText(shareTitle + ' ' + shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {open && showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.2}
                    colors={['#002D72', '#E81828', '#FDB827', '#0C2340', '#189FD6']} // MLB colors
                />
            )}
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-lg border border-gray-200">
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 rounded-full shadow-lg">
                            <Trophy className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <DialogHeader className="px-6 pt-10">
                        <DialogTitle className="text-2xl font-bold text-center text-green-600">
                            Congratulations!
                        </DialogTitle>
                    </DialogHeader>
                    <div className="px-6 py-4 space-y-4">
                        <div className="text-center space-y-2">
                            <p className="text-lg font-medium text-gray-800">
                                You guessed correctly!
                            </p>
                            <p className="text-gray-600">
                                You identified <span className="font-semibold text-mlb-blue">{displayName}</span> in{' '}
                                <span className="font-semibold text-mlb-blue">{guessCount}</span>{' '}
                                {guessCount === 1 ? 'try' : 'tries'}
                                {maxGuesses ? ` out of ${maxGuesses}` : ''}!
                            </p>
                        </div>

                        <div className="pt-2 space-y-3">
                            <p className="text-sm font-medium text-gray-700">Share your victory:</p>

                            <Button
                                onClick={copyToClipboard}
                                variant="outline"
                                className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copied!' : 'Copy to Clipboard'}
                            </Button>

                            <div className="flex justify-center gap-6 pt-2">
                                <TwitterShareButton url={shareUrl} title={shareTitle} className="flex flex-col items-center">
                                    <div className="p-2 rounded-full bg-[#1DA1F2] text-white hover:bg-[#1A91DA] transition-colors">
                                        <Twitter className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs mt-1 text-gray-600">X</span>
                                </TwitterShareButton>

                                <FacebookShareButton url={shareUrl} quote={shareTitle} className="flex flex-col items-center">
                                    <div className="p-2 rounded-full bg-[#1877F2] text-white hover:bg-[#166FE5] transition-colors">
                                        <Facebook className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs mt-1 text-gray-600">Facebook</span>
                                </FacebookShareButton>

                                <button onClick={shareToInstagram} className="flex flex-col items-center">
                                    <div className="p-2 rounded-full bg-gradient-to-tr from-[#FFDC80] via-[#F56040] to-[#833AB4] text-white hover:opacity-90 transition-opacity">
                                        <Instagram className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs mt-1 text-gray-600">Instagram</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="px-6 bg-mlb-blue hover:bg-mlb-blue/90 transition-colors text-white"
                        >
                            Continue
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default VictoryModal; 