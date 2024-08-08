import React from "react";
import { Container} from "react-bootstrap";

interface Props {
    userDisplayName?: string | null;
}

const SubscribedSplash: React.FC<Props> = ({userDisplayName = null}: Props) => {
    const gifUrl = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGwyeXUxb2hrbnkyZDdnc2F0czI2cWRsZ244bDNyeGU3ZDczenM1MiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UO5elnTqo4vSg/giphy.gif";
    
    return (
        <>
            <Container className="mt-5 text-center" style={{ width: "70%", maxWidth: "350px" }}>
                { userDisplayName && 
                    <h1 className="text-center" style={{ 
                        fontFamily: "'Nunito Sans', sans-serif", 
                        fontWeight: 400, 
                        fontSize: '30px', 
                        lineHeight: '40.92px', 
                        textAlign: 'center' 
                    }}>
                        {userDisplayName}, 
                    </h1>
                }
                <h1 className="text-center" style={{ 
                        fontFamily: "'Nunito Sans', sans-serif", 
                        fontWeight: 400, 
                        fontSize: '30px', 
                        lineHeight: '40.92px', 
                        textAlign: 'center' 
                    }}>
                    You've joined the Thea pilot
                </h1>

                <img src={gifUrl} alt="Celebration" style={{ maxWidth: "100%", height: "auto", marginTop: "20px" }} />
                <br />
                <br />
                <p>Keep an eye on your email for next steps. We'll be in touch soon.</p>
            </Container>
        </>
    );
};

export default SubscribedSplash;