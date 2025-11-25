export default function DropDown() {
  return (
    <div className="relative size-full" data-name="Drop down">
      <div className="absolute bg-white h-[420px] left-0 rounded-[10px] shadow-[0px_2px_15px_0px_rgba(61,120,203,0.15)] top-0 w-[1117px]" />
      <div className="absolute font-['Poppins:SemiBold',sans-serif] h-[28px] leading-[28px] left-[calc(50%-526.5px)] not-italic text-[#5b5b5b] text-[15px] top-[19px] w-[143px]">
        <p className="mb-0">Builder</p>
        <p>&nbsp;</p>
      </div>
      <p className="absolute font-['Poppins:SemiBold',sans-serif] h-[28px] leading-[28px] left-[calc(50%+27.5px)] not-italic text-[#5b5b5b] text-[15px] top-[230px] w-[143px]">Handyman</p>
      <p className="absolute font-['Poppins:SemiBold',sans-serif] h-[28px] leading-[28px] left-[calc(50%-231.5px)] not-italic text-[#5b5b5b] text-[15px] top-[19px] w-[143px]">Cleaning</p>
      <p className="absolute font-['Poppins:SemiBold',sans-serif] h-[28px] leading-[28px] left-[calc(50%+27.5px)] not-italic text-[#5b5b5b] text-[15px] top-[19px] w-[143px]">Plumbers</p>
      <p className="absolute font-['Poppins:SemiBold',sans-serif] h-[28px] leading-[28px] left-[calc(50%+246.5px)] not-italic text-[#5b5b5b] text-[15px] top-[230px] w-[143px]">Gas Engineer</p>
      <p className="absolute font-['Poppins:SemiBold',sans-serif] h-[28px] leading-[28px] left-[calc(50%+244.5px)] not-italic text-[#5b5b5b] text-[15px] top-[19px] w-[143px]">Bathroom Fitters</p>
      <div className="absolute font-['Poppins:Regular',sans-serif] h-[326px] leading-[28px] left-[calc(50%-526.5px)] not-italic text-[#5b5b5b] text-[15px] top-[48px] w-[289px]">
        <p className="mb-0">{`Extension `}</p>
        <p className="mb-0">Conversion</p>
        <p className="mb-0">Building a house</p>
        <p className="mb-0">Small structural changes or repairs</p>
        <p className="mb-0">Large structural changes or repairs</p>
        <p className="mb-0">Refurbishments</p>
        <p className="mb-0">Cladding</p>
        <p className="mb-0">Concreting</p>
        <p className="mb-0">Car ports</p>
        <p className="mb-0">Outbuildings</p>
        <p>{`Planning, design & support`}</p>
      </div>
      <div className="absolute font-['Poppins:Regular',sans-serif] h-[144px] leading-[28px] left-[calc(50%+27.5px)] not-italic text-[#5b5b5b] text-[15px] top-[259px] w-[289px]">
        <p className="mb-0">Small repairs</p>
        <p className="mb-0">Small furniture assembly</p>
        <p className="mb-0">Pressure wash</p>
        <p className="mb-0">{`Strip & repaint patio`}</p>
        <p>Build an outdoor shed</p>
      </div>
      <div className="absolute font-['Poppins:Regular',sans-serif] h-[287px] leading-[28px] left-[calc(50%-231.5px)] not-italic text-[#5b5b5b] text-[15px] top-[48px] w-[289px]">
        <p className="mb-0 text-[#fe8a0f]">House Cleaning</p>
        <p className="mb-0">Oven Cleaning</p>
        <p className="mb-0">{`Commercial & Office Cleaning`}</p>
        <p className="mb-0">End of Tenancy Cleaning</p>
        <p className="mb-0">Gutter Cleaning</p>
        <p className="mb-0">Carpet Cleaning</p>
        <p className="mb-0">{`Car Cleaning & Valet`}</p>
        <p className="mb-0">Window Cleaners</p>
        <p className="mb-0">House Clearance</p>
        <p>Deep Cleaning Services</p>
      </div>
      <div className="absolute font-['Poppins:Regular',sans-serif] h-[179px] leading-[28px] left-[calc(50%+27.5px)] not-italic text-[#5b5b5b] text-[15px] top-[48px] w-[165px]">
        <p className="mb-0">Boilers</p>
        <p className="mb-0">Fixtures</p>
        <p className="mb-0">{`Blockages & leaks`}</p>
        <p className="mb-0">{`Pipework & drainage`}</p>
        <p className="mb-0">Radiators</p>
        <p>Appliances</p>
      </div>
      <div className="absolute font-['Poppins:Regular',sans-serif] h-[276px] leading-[28px] left-[calc(50%+246.5px)] not-italic text-[#5b5b5b] text-[15px] top-[259px] w-[285px]">
        <p className="mb-0">Gas safety check</p>
        <p className="mb-0">Service boiler or appliance</p>
        <p className="mb-0">Install or replace boiler or appliance</p>
        <p className="mb-0">Move or remove boiler or appliance</p>
        <p>Pipework only</p>
      </div>
      <div className="absolute font-['Poppins:Regular',sans-serif] h-[187px] leading-[28px] left-[calc(50%+244.5px)] not-italic text-[#5b5b5b] text-[15px] top-[48px] w-[289px]">
        <p className="mb-0">Bathroom Installation</p>
        <p className="mb-0">Bathroom Refurbishment/Installation</p>
        <p className="mb-0">Bathroom Designer</p>
        <p className="mb-0">Bathroom Repair</p>
        <p className="mb-0">Install or replace fixture</p>
        <p>Tiling</p>
      </div>
    </div>
  );
}