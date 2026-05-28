


"use client";

import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Building, Globe, Phone } from "lucide-react";

const ViewContractdetails = ({ fields = [], company, onUpdate, clientinfo }) => {
  const sigRef = useRef({});


  console.log(clientinfo)

  const handleClear = (id) => {
    sigRef.current[id]?.clear();
    onUpdate(id, { signatureData: "" });
  };

  const handleSave = (id) => {
    const sigData = sigRef.current[id]?.toDataURL("image/png");
    onUpdate(id, { signatureData: sigData });
  };

  return (
    <div className="relative max-w-[794px] p-8 space-y-8 rounded-2xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">

      {/* --------------------------- Watermark --------------------------- */}
      {company?.name && (
        <div
          className="absolute inset-0 flex justify-center items-center pointer-events-none select-none"
          style={{
            opacity: 0.05,
            fontSize: "10rem",
            fontWeight: 900,
            transform: "rotate(-25deg)",
            textTransform: "uppercase",
            letterSpacing: "0.5rem",
            color: "#000",
            whiteSpace: "nowrap",
          }}
        >
          {company.name}
        </div>
      )}

      {/* --------------------------- Company Header --------------------------- */}
      {company && (
        <header className="relative z-10 flex justify-between items-center border-b pb-6">
          <div className="flex items-center gap-4">
            {company.companyLogo && (
              <img
                src={company.companyLogo}
                alt="Company Logo"
                className="w-16 h-16 object-contain bg-white rounded-lg dark:border-gray-700"
              />
            )}

            <div>
              <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">
                {company.name}
              </h1>

              {company.companyEmail && (
                <p className="text-sm text-gray-500">{company.companyEmail}</p>
              )}
            </div>
          </div>

          <div className="text-right text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {company.companyAddress && (
              <div className="flex items-center justify-end gap-2">
                <Building size={15} className="text-gray-400" />
                <span>{company.companyAddress}</span>
              </div>
            )}

            {company.companyPhoneNumber && (
              <div className="flex items-center justify-end gap-2">
                <Phone size={15} className="text-gray-400" />
                <span>{company.companyPhoneNumber}</span>
              </div>
            )}

            {company.companyWebsite && (
              <div className="flex items-center justify-end gap-2">
                <Globe size={15} className="text-gray-400" />
                <a
                  href={company.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  {company.companyWebsite.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "")}
                </a>
              </div>
            )}
          </div>
        </header>
      )}

      {/* --------------------------- Client Greeting --------------------------- */}
      {clientinfo && (
        <section className="relative z-10">
          {clientinfo.clientName && (
            <div className="px-6">
              <span className="text-lg font-semibold">
                Hi {clientinfo.clientName},
              </span>
            </div>
          )}
        </section>
      )}

      {/* --------------------------- Contract Fields --------------------------- */}
      <section className="relative z-10 space-y-4">
        {fields
          .filter((f) => f.type !== "company_info_block" && f.type !== "client_info_block")
          .map((field) => (
            <div key={field.id} className="p-4 transition-all border-b dark:border-gray-700">

              {/* SHORT ANSWER */}
              {field.type === "short_answer" && (
                <FieldBlock label={field.question} value={field.answer} />
              )}

              {/* PARAGRAPH */}
              {field.type === "paragraph" && (
                <FieldBlock
                  label={field.question}
                  value={field.answer}
                  multiline
                />
              )}

              {/* MULTIPLE CHOICE */}
              {field.type === "multiple_choice" && (
                <FieldBlock label={field.question} value={field.answer} />
              )}

              {/* CHECKBOXES */}
              {field.type === "checkboxes" && (
                <FieldBlock
                  label={field.question}
                  value={
                    Array.isArray(field.answer)
                      ? field.answer.join(", ")
                      : "—"
                  }
                />
              )}

              {/* DROPDOWN */}
              {field.type === "dropdown" && (
                <FieldBlock label={field.question} value={field.answer} />
              )}

              {/* DATE */}
              {field.type === "date" && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {field.question}
                  </p>

                  {field.answer ? (
                    <p className="text-gray-700 dark:text-gray-300">{field.answer}</p>
                  ) : (
                    <input
                      type="date"
                      value=""
                      onChange={(e) =>
                        onUpdate(field.id, { answer: e.target.value })
                      }
                      className="border rounded p-2 w-full bg-transparent text-gray-700 dark:text-gray-300"
                    />
                  )}
                </div>
              )}

              {/* APPENDIX */}
              {field.type === "appendix" && field.answer && (
                <FieldBlock label={field.question} value={field.answer} />
              )}

              {/* SIGNATURE BLOCK */}
              {field.type === "signature" && (
                <SignatureField
                  field={field}
                  sigRef={sigRef}
                  onUpdate={onUpdate}
                  handleClear={handleClear}
                  handleSave={handleSave}
                />
              )}
            </div>
          ))}
      </section>

      {/* --------------------------- Footer --------------------------- */}
      <footer className="relative z-10 border-t pt-6 mt-10 text-sm flex justify-between items-center text-gray-600 dark:text-gray-400">
        <div>{company?.companyAddress}</div>

        <p className="text-xs">
          © {new Date().getFullYear()} {company?.name}. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

/* -------------------------------- Helper Components ------------------------------ */

const FieldBlock = ({ label, value, multiline }) => (
  <div>
    <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{label}</p>

    <p
      className={`text-gray-700 dark:text-gray-300 ${multiline ? "whitespace-pre-line" : ""
        }`}
    >
      {value || "—"}
    </p>
  </div>
);

const SignatureField = ({ field, sigRef, onUpdate, handleClear, handleSave }) => (
  <div className="flex flex-col gap-3">
    <p className="font-semibold text-gray-800 dark:text-gray-100">{field.question}</p>

    {/* PAD SIGNATURE */}
    {field.signatureType === "pad" ? (
      field.signatureData ? (
        <img
          src={field.signatureData}
          alt="Signature"
          className="border rounded-lg w-full h-44 object-contain bg-white dark:bg-gray-900"
        />
      ) : (
        <>
          <SignatureCanvas
            ref={(ref) => (sigRef.current[field.id] = ref)}
            penColor="black"
            canvasProps={{
              className:
                "border rounded-lg w-full h-44 bg-white dark:bg-gray-900",
            }}
          />

          <div className="flex gap-2">
            <button
              onClick={() => handleClear(field.id)}
              className="px-4 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear
            </button>

            <button
              onClick={() => handleSave(field.id)}
              className="px-4 py-1.5 text-sm bg-[#5965AB] text-white rounded-md hover:bg-[#5f6ebe]"
            >
              Save
            </button>
          </div>
        </>
      )
    ) : (
      /* TYPED SIGNATURE */
      <TypedSignature field={field} onUpdate={onUpdate} handleSave={handleSave} />
    )}
  </div>
);

const TypedSignature = ({ field, onUpdate, handleSave }) => (
  <>

    {field.typedSignature ? (
      // -------------------- SHOW ONLY FINAL SIGNATURE --------------------
      <p
        className="text-3xl text-gray-700 dark:text-gray-200"
        style={{ fontFamily: field.fontFamily || "Allura" }}
      >
        {field.typedSignature}
      </p>
    ) : (
      // -------------------- SHOW EDITABLE AREA (NO FINAL SIGNATURE SAVED YET) --------------------
      <>
        <input
          type="text"
          placeholder="Type your signature"
          value={field.tempTypedSignature || ""}
          onChange={(e) =>
            onUpdate(field.id, { tempTypedSignature: e.target.value })
          }
          className="w-full border rounded-lg p-2 bg-transparent dark:text-gray-100"
        />

        <div className="flex items-center gap-4">
          <Select
            value={field.fontFamily || "Allura"}
            onValueChange={(val) => onUpdate(field.id, { fontFamily: val })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Font" />
            </SelectTrigger>

            <SelectContent>
              {[
                "Allura",
                "Great Vibes",
                "Dancing Script",
                "Pacifico",
                "Cedarville Cursive",
              ].map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Live Preview */}
          <p
            className="text-3xl text-gray-700 dark:text-gray-200"
            style={{ fontFamily: field.fontFamily || "Allura" }}
          >
            {field.tempTypedSignature || "—"}
          </p>
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={() =>
            onUpdate(field.id, {
              typedSignature: field.tempTypedSignature || "",
              tempTypedSignature: "",
            })
          }
          className="mt-2 px-4 py-1.5 text-sm bg-[#5965AB] text-white rounded-md hover:bg-[#5f6ebe]"
        >
          Save
        </button>
      </>
    )}
    {/* {field.typedSignature ? (
      <p
        className="text-3xl text-gray-700 dark:text-gray-200"
        style={{ fontFamily: field.fontFamily || "Allura" }}
      >
        {field.typedSignature}
      </p>
    ) : (
      <>
        <input
          type="text"
          placeholder="Type your signature"
          value={field.typedSignature || ""}
          onChange={(e) =>
            onUpdate(field.id, { typedSignature: e.target.value })
          }
          className="w-full border rounded-lg p-2 bg-transparent dark:text-gray-100"
        />

        <div className="flex items-center gap-4">
          <Select
            value={field.fontFamily || "Allura"}
            onValueChange={(val) => onUpdate(field.id, { fontFamily: val })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Font" />
            </SelectTrigger>

            <SelectContent>
              {[
                "Allura",
                "Great Vibes",
                "Dancing Script",
                "Pacifico",
                "Cedarville Cursive",
              ].map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p
            className="text-3xl text-gray-700 dark:text-gray-200"
            style={{ fontFamily: field.fontFamily || "Allura" }}
          >
            {field.tempTypedSignature || "—"}
          </p>
        </div>

        <button
          onClick={(e) =>
            onUpdate(field.id, { typedSignature: e.target.value })}
          className="mt-2 px-4 py-1.5 text-sm bg-[#5965AB] text-white rounded-md hover:bg-[#5f6ebe]"
        >
          Save
        </button>
      </>
    )} */}
  </>
);

export default ViewContractdetails;
