'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DrawResult, Participant } from '@/types';
import { updateDrawResultSignature } from '@/lib/database';
import toast from 'react-hot-toast';

interface AcknowledgementLetterProps {
  drawResult: DrawResult;
  participant: Participant;
  prizeName: string;
  prizeImageUrl?: string;
  onClose?: () => void;
}

const AcknowledgementLetter: React.FC<AcknowledgementLetterProps> = ({
  drawResult,
  participant,
  prizeName,
  prizeImageUrl,
  onClose,
}) => {
  const [isSignatureMode, setIsSignatureMode] = useState(false);
  const [isSigned, setIsSigned] = useState(drawResult.acknowledgementSigned);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>((drawResult as any).signature || null);
  const letterRef = useRef<HTMLDivElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawDate = drawResult.drawDate instanceof Date 
    ? drawResult.drawDate 
    : new Date((drawResult.drawDate as any).seconds ? (drawResult.drawDate as any).seconds * 1000 : drawResult.drawDate);

  const getEventCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!signatureCanvasRef.current) return null;
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.nativeEvent instanceof MouseEvent) {
      clientX = e.nativeEvent.clientX;
      clientY = e.nativeEvent.clientY;
    } else if (e.nativeEvent instanceof TouchEvent) {
      if (e.nativeEvent.touches.length === 0) return null;
      clientX = e.nativeEvent.touches[0].clientX;
      clientY = e.nativeEvent.touches[0].clientY;
    } else {
      return null;
    }
    
    // 计算 CSS 拉伸比例 (Calculate scaling ratio)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getEventCoordinates(e);
    if (!coords || !signatureCanvasRef.current) return;
    
    const ctx = signatureCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getEventCoordinates(e);
    if (!coords || !signatureCanvasRef.current) return;

    const ctx = signatureCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const handleClearSignature = () => {
    if (signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleConfirmSignature = async () => {
    if (!signatureCanvasRef.current) return;
    const signatureData = signatureCanvasRef.current.toDataURL();

    try {
      await updateDrawResultSignature(drawResult.id, true, signatureData);
      setIsSigned(true);
      setIsSignatureMode(false);
      setSignatureImage(signatureData);
      toast.success('Acknowledgement ticked and signature saved successfully! 🎉');
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Failed to save signature');
    }
  };

  const handleDownloadPDF = async () => {
    if (!letterRef.current) return;

    setIsDownloading(true);
    let pdfLetter: HTMLElement | null = null;
    try {
      const element = letterRef.current;
      await document.fonts.ready;
      await Promise.all(
        Array.from(element.querySelectorAll('img')).map(async (image) => {
          if (!image.complete) {
            await new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            });
          }
          try {
            await image.decode();
          } catch {
            // Some browsers do not support decode for every loaded image type.
          }
        })
      );

      pdfLetter = element.cloneNode(true) as HTMLElement;
      pdfLetter.removeAttribute('style');
      pdfLetter.style.position = 'fixed';
      pdfLetter.style.left = '0';
      pdfLetter.style.top = '0';
      pdfLetter.style.zIndex = '-9999';
      pdfLetter.style.pointerEvents = 'none';
      pdfLetter.style.width = '794px';
      pdfLetter.style.maxWidth = '794px';
      pdfLetter.style.minHeight = '0';
      pdfLetter.style.margin = '0';
      pdfLetter.style.padding = '42px 52px';
      pdfLetter.style.boxSizing = 'border-box';
      pdfLetter.style.overflow = 'visible';
      pdfLetter.style.transform = 'none';
      pdfLetter.style.animation = 'none';
      pdfLetter.style.display = 'block';
      pdfLetter.style.backgroundColor = '#ffffff';
      pdfLetter.style.color = '#000000';
      pdfLetter.style.border = 'none';
      pdfLetter.style.borderRadius = '0';
      pdfLetter.style.boxShadow = 'none';
      pdfLetter.style.fontFamily = 'Arial, Helvetica, sans-serif';
      pdfLetter.style.fontSize = '15px';
      pdfLetter.style.fontKerning = 'none';
      Array.from(pdfLetter.children).forEach((child) => {
        const section = child as HTMLElement;
        section.style.flexShrink = '0';
        section.style.marginBottom = '24px';
      });
      pdfLetter.querySelectorAll<HTMLElement>('*').forEach((child) => {
        child.style.animation = 'none';
        child.style.transition = 'none';
        child.style.textRendering = 'geometricPrecision';
        child.style.overflow = 'visible';
      });
      pdfLetter.querySelectorAll<HTMLElement>('p, h1, h2, h3, span, li').forEach((textElement) => {
        textElement.style.lineHeight = '1.5';
        textElement.style.paddingTop = '1px';
        textElement.style.paddingBottom = '1px';
      });
      const header = pdfLetter.firstElementChild as HTMLElement | null;
      if (header) {
        header.style.marginBottom = '28px';
        header.style.paddingBottom = '16px';
        const title = header.querySelector<HTMLElement>('h1');
        if (title) {
          title.style.fontSize = '30px';
          title.style.lineHeight = '1.18';
          title.style.marginBottom = '8px';
        }
        const subtitle = header.querySelector<HTMLElement>('p');
        if (subtitle) {
          subtitle.style.fontSize = '13px';
          subtitle.style.lineHeight = '1.4';
        }
      }
      const finalSection = pdfLetter.lastElementChild as HTMLElement | null;
      if (finalSection) finalSection.style.marginBottom = '0';
      document.body.appendChild(pdfLetter);

      const canvas = await html2canvas(pdfLetter, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const maxWidth = pdfWidth - 16;
      const maxHeight = pdfHeight - 16;
      const scaleToFit = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const imgWidth = canvas.width * scaleToFit;
      const imgHeight = canvas.height * scaleToFit;
      const marginX = (pdfWidth - imgWidth) / 2;
      const marginY = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', marginX, marginY, imgWidth, imgHeight);
      pdf.save(`Acknowledgement-${drawResult.referenceNumber || 'Letter'}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(`PDF Error: ${error?.message || 'Please try again on Chrome/Safari.'}`);
    } finally {
      pdfLetter?.remove();
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      {!isSignatureMode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="mb-8 p-6 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-lg shadow-lg text-center border-2 border-red-600"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-2">🎉 Congratulations!</h2>
          <p className="text-xl text-gray-700 mb-2">You have won:</p>
          <p className="text-4xl font-bold text-red-600">{prizeName}</p>
          <p className="text-sm text-gray-600 mt-4">Reference: {drawResult.referenceNumber}</p>
        </motion.div>
      )}

      <div
        ref={letterRef}
        data-pdf-letter
        className="bg-white text-black rounded-lg shadow-lg p-12 border-4 border-black mb-6"
        style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#000000', fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        <div className="text-center mb-8 pb-6 border-b-2 border-black" style={{ borderColor: '#000000' }}>
          <h1 className="text-3xl font-bold text-black mb-2" style={{ color: '#000000' }}>LUCKY DRAW PRIZE ACKNOWLEDGEMENT LETTER</h1>
          <p className="text-sm text-gray-600" style={{ color: '#4b5563' }}>Property Client Appreciation Campaign</p>
        </div>

        <div className="space-y-6 mb-8 text-justify">
          <p className="text-sm leading-relaxed" style={{ color: '#000000' }}>
            <span className="font-bold">I, {participant.fullName}</span>
            {participant.icPassport && (
              <>
                , IC/Passport No. <span className="font-bold">{participant.icPassport}</span>
              </>
            )}
            , hereby acknowledge that I have participated in the property lucky draw campaign organised by 
            our esteemed property agent team.
          </p>

          <div className="bg-gray-50 p-6 border-l-4 border-yellow-400 rounded" style={{ backgroundColor: '#f9fafb', borderColor: '#facc15' }}>
            <p className="font-bold text-lg mb-3" style={{ color: '#000000' }}>Prize Won:</p>
            <div className={`flex items-center gap-5 ${prizeImageUrl ? 'flex-col sm:flex-row' : ''}`}>
              {prizeImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={prizeImageUrl}
                  alt={prizeName}
                  crossOrigin="anonymous"
                  className="h-32 w-full max-w-48 shrink-0 rounded-lg border border-gray-200 bg-white object-contain p-2"
                  style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
                />
              )}
              <p className="text-xl text-red-600 font-bold" style={{ color: '#dc2626' }}>{prizeName}</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: '#000000' }}>
            This prize is subject to the campaign terms and conditions. I understand that the organiser
            reserves the right to verify my eligibility before prize redemption.
          </p>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg mb-8" style={{ backgroundColor: '#f3f4f6' }}>
          <h3 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2" style={{ borderColor: '#d1d5db', color: '#000000' }}>Client Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600" style={{ color: '#4b5563' }}>Full Name:</p>
              <p className="font-semibold" style={{ color: '#000000' }}>{participant.fullName}</p>
            </div>
            {participant.icPassport && (
              <div>
                <p className="text-gray-600" style={{ color: '#4b5563' }}>IC / Passport:</p>
                <p className="font-semibold" style={{ color: '#000000' }}>{participant.icPassport}</p>
              </div>
            )}
            {participant.phoneNumber && (
              <div>
                <p className="text-gray-600" style={{ color: '#4b5563' }}>Phone:</p>
                <p className="font-semibold" style={{ color: '#000000' }}>{participant.phoneNumber}</p>
              </div>
            )}
            {participant.email && (
              <div>
                <p className="text-gray-600" style={{ color: '#4b5563' }}>Email:</p>
                <p className="font-semibold text-xs" style={{ color: '#000000' }}>{participant.email}</p>
              </div>
            )}
            {participant.projectName && (
              <div>
                <p className="text-gray-600" style={{ color: '#4b5563' }}>Project:</p>
                <p className="font-semibold" style={{ color: '#000000' }}>{participant.projectName}</p>
              </div>
            )}
            {participant.unitNumber && (
              <div>
                <p className="text-gray-600" style={{ color: '#4b5563' }}>Unit No.:</p>
                <p className="font-semibold" style={{ color: '#000000' }}>{participant.unitNumber}</p>
              </div>
            )}
            {participant.agentName && (
              <div>
                <p className="text-gray-600" style={{ color: '#4b5563' }}>Agent Name:</p>
                <p className="font-semibold" style={{ color: '#000000' }}>{participant.agentName}</p>
              </div>
            )}
            <div>
              <p className="text-gray-600" style={{ color: '#4b5563' }}>Draw Reference No.:</p>
              <p className="font-semibold" style={{ color: '#000000' }}>{drawResult.referenceNumber}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-300" style={{ borderColor: '#d1d5db' }}>
            <p className="text-gray-600" style={{ color: '#4b5563' }}>Draw Date:</p>
            <p className="font-semibold" style={{ color: '#000000' }}>{drawDate.toLocaleString('en-MY')}</p>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg mb-8 text-xs border border-red-200" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          <p className="font-bold text-red-800 mb-2" style={{ color: '#991b1b' }}>Terms and Conditions:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700" style={{ color: '#374151' }}>
            <li>Prize is subject to availability and cannot be exchanged for cash.</li>
            <li>Winner must provide valid identification for prize redemption.</li>
            <li>Prize must be claimed within 6 months from the draw date.</li>
            <li>The organiser reserves the right to verify eligibility.</li>
            <li>This letter serves as proof of winning. Please keep it safe.</li>
          </ul>
        </div>

        {!isSignatureMode && (
          <div className="mb-8">
            <label 
              className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${!isSigned ? 'cursor-pointer hover:bg-blue-100' : 'cursor-default'}`} 
              style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}
              onClick={(e) => {
                e.preventDefault(); // 防止默认的 checkbox 点击事件
                if (!isSigned) {
                  toast('Please click "Add Signature" below to agree and sign.', { icon: '✍️' });
                }
              }}
            >
              <input
                type="checkbox"
                checked={isSigned}
                readOnly
                className="w-5 h-5 rounded border-gray-300 pointer-events-none"
                style={{ borderColor: '#d1d5db' }}
              />
              <span className="text-sm text-gray-700" style={{ color: '#374151' }}>
                I confirm that the information provided is accurate and I acknowledge receipt/entitlement of the prize.
              </span>
            </label>
          </div>
        )}

        {!isSignatureMode ? (
          <div className="mt-8 pt-8 border-t-2 border-black" style={{ borderColor: '#000000' }}>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-bold mb-8" style={{ color: '#000000' }}>Client Signature:</p>
                {signatureImage ? (
                  <div className="border-b-2 border-black min-h-16 flex items-end justify-center pb-2" style={{ borderColor: '#000000' }}>
                    <img src={signatureImage} alt="Client Signature" className="max-h-16 object-contain" />
                  </div>
                ) : (
                  <div className="border-b-2 border-black min-h-16" style={{ borderColor: '#000000' }}></div>
                )}
                <p className="text-xs text-gray-600 mt-2" style={{ color: '#4b5563' }}>{participant.fullName}</p>
              </div>
              <div className="relative">
                <p className="text-sm font-bold mb-8" style={{ color: '#000000' }}>Date:</p>
                <div className="border-b-2 border-black min-h-16" style={{ borderColor: '#000000' }}></div>
                <p className="text-xs text-gray-600 mt-2" style={{ color: '#4b5563' }}>{drawDate.toLocaleDateString('en-MY')}</p>
                {isSigned && (
                  <motion.div
                    initial={{ scale: 3, opacity: 0, rotate: -25 }}
                    animate={{ scale: 1, opacity: 0.85, rotate: -15 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="absolute top-4 left-8 border-[3px] border-red-600 text-red-600 text-2xl font-black px-3 py-1 rounded uppercase tracking-widest pointer-events-none"
                    style={{ color: '#dc2626', borderColor: '#dc2626', backgroundColor: 'transparent' }}
                  >
                    VERIFIED
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 pt-8 border-t-2 border-black" style={{ borderColor: '#000000' }}>
            <p className="text-sm font-bold mb-4" style={{ color: '#000000' }}>Draw Your Signature Below:</p>
            <canvas
              ref={signatureCanvasRef}
              width={400}
              height={150}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="border-2 border-gray-300 rounded-lg bg-white cursor-crosshair w-full"
              style={{ touchAction: 'none', backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {!isSignatureMode ? (
          <>
            <motion.button
              onClick={() => setIsSignatureMode(true)}
              disabled={isSigned}
              whileHover={!isSigned ? { scale: 1.05 } : {}}
              whileTap={!isSigned ? { scale: 0.95 } : {}}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                isSigned
                  ? 'bg-gray-400 cursor-not-allowed opacity-70 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSigned ? '✓ Signed' : 'Add Signature'}
            </motion.button>

            <motion.button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              whileHover={!isDownloading ? { scale: 1.05 } : {}}
              whileTap={!isDownloading ? { scale: 0.95 } : {}}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                isDownloading
                  ? 'bg-gray-400 cursor-not-allowed opacity-70 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isDownloading ? 'Downloading...' : '⬇ Download PDF'}
            </motion.button>

            {onClose && (
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-lg font-bold bg-gray-600 hover:bg-gray-700 text-white"
              >
                Close
              </motion.button>
            )}
          </>
        ) : (
          <>
            <motion.button
              onClick={handleClearSignature}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              Clear Signature
            </motion.button>

            <motion.button
              onClick={handleConfirmSignature}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Signature
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AcknowledgementLetter;
