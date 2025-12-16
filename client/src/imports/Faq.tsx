function Group() {
  return (
    <div className="absolute contents left-[43px] top-[79px]">
      <div className="absolute bg-white h-[113px] left-[43px] rounded-[10px] top-[79px] w-[928px]" />
      <p className="absolute font-['Roboto:Black',sans-serif] leading-[20px] left-[940.8px] not-italic text-[#fe8a0f] text-[24px] top-[94px] w-[12.813px]">-</p>
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[calc(50%-446px)] not-italic text-[#3d78cb] text-[20px] top-[99px] w-[428px]">How do I list my service?</p>
      <p className="absolute font-['Roboto:Regular',sans-serif] leading-[20px] left-[calc(50%-445.696px)] not-italic text-[#5b5b5b] text-[14px] top-[134px] w-[800.789px]">Lorem ipsum dolor sit amet consectetur. Enim vitae gravida turpis platea turpis. Et diam aliquam ut augue. Lacus purus amet quis sed lorem feugiat ut eleifend volutpat. Congue pellentesque quam nibh purus faucibus.</p>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[43px] top-[206px]">
      <div className="absolute bg-white h-[59px] left-[43px] rounded-[10px] top-[206px] w-[928px]" />
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[940.8px] not-italic text-[#fe8a0f] text-[24px] top-[225px] w-[14.643px]">+</p>
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[calc(50%-446px)] not-italic text-[#3d78cb] text-[20px] top-[226px] w-[421px]">How much does it cost?</p>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[43px] top-[279px]">
      <div className="absolute bg-white h-[59px] left-[43px] rounded-[10px] top-[279px] w-[928px]" />
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[940.8px] not-italic text-[#fe8a0f] text-[24px] top-[298px] w-[14.643px]">+</p>
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[calc(50%-446px)] not-italic text-[#3d78cb] text-[20px] top-[299px] w-[438px]">How much money can I make?</p>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-[43px] top-[352px]">
      <div className="absolute bg-white h-[59px] left-[43px] rounded-[10px] top-[352px] w-[928px]" />
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[940.8px] not-italic text-[#fe8a0f] text-[24px] top-[371px] w-[14.643px]">+</p>
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[calc(50%-446px)] not-italic text-[#3d78cb] text-[20px] top-[372px] w-[334px]">How do I get paid?</p>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents left-[43px] top-[425px]">
      <div className="absolute bg-white h-[59px] left-[43px] rounded-[10px] top-[425px] w-[928px]" />
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[940.8px] not-italic text-[#fe8a0f] text-[24px] top-[444px] w-[14.643px]">+</p>
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[calc(50%-446px)] not-italic text-[#3d78cb] text-[20px] top-[445px] w-[494px]">How do I price my service?</p>
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents left-[43px] top-[498px]">
      <div className="absolute bg-white h-[59px] left-[43px] rounded-[10px] top-[498px] w-[928px]" />
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[940.8px] not-italic text-[#fe8a0f] text-[24px] top-[517px] w-[14.643px]">+</p>
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[calc(50%-446px)] not-italic text-[#3d78cb] text-[20px] top-[518px] w-[451px]">Do I have to work all the time?</p>
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute contents left-[43px] top-[571px]">
      <div className="absolute bg-white h-[59px] left-[43px] rounded-[10px] top-[571px] w-[928px]" />
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[940.8px] not-italic text-[#fe8a0f] text-[24px] top-[590px] w-[14.643px]">+</p>
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-[20px] left-[calc(50%-446px)] not-italic text-[#3d78cb] text-[20px] top-[591px] w-[854px]">Can I list pricing based on unit measurement, hourly rate and so on?</p>
    </div>
  );
}

export default function Faq() {
  return (
    <div className="relative size-full" data-name="FAQ">
      <p className="absolute font-['Roboto:Bold',sans-serif] leading-none left-1/2 not-italic text-[#2c353f] text-[24px] text-center text-nowrap top-0 translate-x-[-50%] whitespace-pre">Frequently Asked Questions</p>
      <Group />
      <Group1 />
      <Group2 />
      <Group3 />
      <Group4 />
      <Group5 />
      <Group6 />
    </div>
  );
}