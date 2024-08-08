import React from "react";

const HeroComponent: React.FC = () => {
    return (
        <>
        <div style={{             
            fontFamily: "'Oooh Baby', cursive", 
            fontWeight: 400, 
            fontSize: '64px', 
            lineHeight: '78.4px', 
            textAlign: 'center' }}>
            Thea
        </div>
        <br />
        <div style={{ 
            fontFamily: "'Nunito Sans', sans-serif", 
            fontWeight: 400, 
            fontSize: '30px', 
            lineHeight: '40.92px', 
            textAlign: 'center' 
        }}>
            <div>
                Gifting Made
            </div>
            <div>
                Magical
            </div>
                
        </div>
        <br />
        </>
    );
};

export default HeroComponent;
