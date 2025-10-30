import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-200 to-green-50 text-center">
      <img 
        src="https://i0.wp.com/malkiyacharity.com/wp-content/uploads/2021/06/cropped-logo-1.png?w=348&ssl=1" 
        alt="شعار جمعية المالكية الخيرية" 
        className="h-16 md:h-20 object-contain"
      />
      <h1 className="text-green-800 text-xl md:text-2xl font-bold mt-3">
        اللجنة الإعلامية
      </h1>
    </header>
  );
};

export default Header;