import React, { useEffect, useMemo, useState } from "react";
import './CreditCardForm.css';

export type CardState = {
  number: string;
  holder: string;
  month: string;
  year: string;
  cvv: string;
};

export type CardValidity = {
  number: boolean;
  holder: boolean;
  month: boolean;
  year: boolean;
  cvv: boolean;
  allValid: boolean;
};

type Props = {
  maskMiddle?: boolean;
  onChange?: (state: CardState, validity: CardValidity) => void;
  onSubmit?: (state: CardState, validity: CardValidity) => void;
  showSubmit?: boolean;
};

function formatNumberSpaces(num: string): string {
  return num.replace(/\s+/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
}

function clampDigits(value: string, maxLen: number) {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

export function CreditCardForm({
  maskMiddle = true,
  onChange,
  onSubmit,
  showSubmit = false,
}: Props) {
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvv, setCVV] = useState("");
  const [focusField, setFocusField] = useState<null | "number" | "holder" | "expire" | "cvv">(null);
  const [installments, setInstallments] = useState("1");

  const flip = focusField === "cvv";

  const years = useMemo(() => {
    const start = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => String(start + i));
  }, []);

  const validity: CardValidity = useMemo(() => {
    const numberValid = number.length >= 13;
    const holderValid = holder.trim().length >= 2;
    const monthValid = !!month && +month >= 1 && +month <= 12;
    const yearValid = !!year && +year >= new Date().getFullYear();
    const cvvValid = /^\d{3,4}$/.test(cvv);
    return {
      number: numberValid,
      holder: holderValid,
      month: monthValid,
      year: yearValid,
      cvv: cvvValid,
      allValid: numberValid && holderValid && monthValid && yearValid && cvvValid,
    };
  }, [number, holder, month, year, cvv]);

  useEffect(() => {
    onChange?.({ number, holder, month, year, cvv }, validity);
  }, [number, holder, month, year, cvv, validity, onChange]);

  const displayDigits = useMemo(() => number.slice(0, 16).split(""), [number]);

  const displayedSlots = useMemo(() => {
    const arr: { char: string; filed: boolean }[] = [];
    for (let i = 0; i < 16; i++) {
      let content = "#";
      if (i < displayDigits.length) {
        const d = displayDigits[i];
        const shouldMask = maskMiddle && i >= 4 && i <= 11;
        content = shouldMask ? "*" : d;
      }
      arr.push({ char: content, filed: i < displayDigits.length });
    }
    return arr;
  }, [displayDigits, maskMiddle]);

  const highlightClass = (() => {
    switch (focusField) {
      case "number": return "hl hl--number";
      case "holder": return "hl hl--holder";
      case "expire": return "hl hl--expire";
      case "cvv":    return "hl hl--cvv";
      default:       return "hl hl--hidden";
    }
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ number, holder, month, year, cvv }, validity);
  };

  return (
    <div className="ccf-root">
      {/* ── CARD VISUAL ── */}
      <div className={`ccf-card ${flip ? "ccf-card--flip" : ""}`}>
        <div className={highlightClass} />

        {/* FRONT */}
        <div className="ccf-card__front">
          <div className="ccf-card__header">
            <span className="ccf-card__brand">Bússola Kids</span>
            {/* Mastercard SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" height="36" width="54" viewBox="-96 -98.908 832 593.448">
              <path fill="#ff5f00" d="M224.833 42.298h190.416v311.005H224.833z" />
              <path d="M244.446 197.828a197.448 197.448 0 0175.54-155.475 197.777 197.777 0 100 311.004 197.448 197.448 0 01-75.54-155.53z" fill="#eb001b" />
              <path d="M621.101 320.394v-6.372h2.747v-1.319h-6.537v1.319h2.582v6.373zm12.691 0v-7.69h-1.978l-2.307 5.493-2.308-5.494h-1.977v7.691h1.428v-5.823l2.143 5h1.483l2.143-5v5.823z" fill="#f79e1b" />
              <path d="M640 197.828a197.777 197.777 0 01-320.015 155.474 197.777 197.777 0 000-311.004A197.777 197.777 0 01640 197.773z" fill="#f79e1b" />
            </svg>
          </div>

          {/* Number slots */}
          <div className="ccf-card__number" aria-label="Número do cartão">
            {displayedSlots.map((slot, idx) => (
              <span key={idx} className={`ccf-slot${(idx + 1) % 4 === 0 && idx < 15 ? " ccf-slot--gap" : ""}`}>
                <span className={`ccf-digit${slot.filed ? " ccf-digit--filed" : ""}`}>
                  <span className="ccf-digit__row ccf-digit__row--placeholder">#</span>
                  <span className="ccf-digit__row ccf-digit__row--value">{slot.char}</span>
                </span>
              </span>
            ))}
          </div>

          <div className="ccf-card__footer">
            <div className="ccf-card__holder-wrap">
              <div className="ccf-card__label">Titular</div>
              <div className="ccf-card__holder-value">{holder || "NOME NO CARTÃO"}</div>
            </div>
            <div className="ccf-card__expires-wrap">
              <div className="ccf-card__label">Validade</div>
              <div className="ccf-card__expires-value">
                {month || "MM"}/{year ? year.slice(-2) : "AA"}
              </div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="ccf-card__back">
          <div className="ccf-card__stripe" />
          <div className="ccf-card__cvv-wrap">
            <span className="ccf-card__label">CVV</span>
            <div className="ccf-card__cvv-field">
              {"•".repeat(cvv.length || 3)}
            </div>
          </div>
        </div>
      </div>

      {/* ── FORM ── */}
      <form className="ccf-form" onSubmit={handleSubmit} noValidate>

        {/* Número */}
        <div className="ccf-field">
          <label htmlFor="ccf-number" className="ccf-label">Número do Cartão</label>
          <input
            id="ccf-number"
            className="ccf-input"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={formatNumberSpaces(number)}
            onChange={(e) => setNumber(clampDigits(e.target.value, 19))}
            onFocus={() => setFocusField("number")}
            onBlur={() => setFocusField(null)}
          />
        </div>

        {/* Titular */}
        <div className="ccf-field">
          <label htmlFor="ccf-holder" className="ccf-label">Nome do Titular</label>
          <input
            id="ccf-holder"
            className="ccf-input"
            type="text"
            autoComplete="cc-name"
            placeholder="COMO IMPRESSO NO CARTÃO"
            value={holder}
            onChange={(e) => setHolder(e.target.value.toUpperCase())}
            onFocus={() => setFocusField("holder")}
            onBlur={() => setFocusField(null)}
          />
        </div>

        {/* Validade + CVV */}
        <div className="ccf-row">
          <div className="ccf-field ccf-field--grow2">
            <label className="ccf-label">Validade</label>
            <div className="ccf-date-row">
              <select
                id="ccf-month"
                className="ccf-input ccf-select"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                onFocus={() => setFocusField("expire")}
                onBlur={() => setFocusField(null)}
              >
                <option value="" disabled>Mês</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                id="ccf-year"
                className="ccf-input ccf-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                onFocus={() => setFocusField("expire")}
                onBlur={() => setFocusField(null)}
              >
                <option value="" disabled>Ano</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ccf-field ccf-field--grow1">
            <label htmlFor="ccf-cvv" className="ccf-label">CVV</label>
            <input
              id="ccf-cvv"
              className="ccf-input"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="•••"
              value={cvv}
              onChange={(e) => setCVV(clampDigits(e.target.value, 4))}
              onFocus={() => setFocusField("cvv")}
              onBlur={() => setFocusField(null)}
            />
          </div>
        </div>

        {/* Parcelas */}
        <div className="ccf-field">
          <label htmlFor="ccf-installments" className="ccf-label">Parcelas</label>
          <select
            id="ccf-installments"
            className="ccf-input ccf-select"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <option key={n} value={String(n)}>
                {n}x {n === 1 ? "à vista (sem juros)" : "sem juros"}
              </option>
            ))}
          </select>
        </div>

        {showSubmit && (
          <button
            type="submit"
            className={`ccf-submit ${validity.allValid ? "ccf-submit--active" : ""}`}
            disabled={!validity.allValid}
          >
            {validity.allValid ? "Confirmar Pagamento" : "Preencha todos os campos"}
          </button>
        )}
      </form>
    </div>
  );
}
