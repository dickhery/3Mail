import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as threeMail_backend_idl, canisterId as threeMail_backend_id } from 'declarations/threeMail_backend';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [principal, setPrincipal] = useState('');
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [response, setResponse] = useState('');
  const [threeMailActor, setThreeMailActor] = useState(null);

  useEffect(() => {
    async function initAuth() {
      const client = await AuthClient.create();
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        const identity = client.getIdentity();
        setPrincipal(identity.getPrincipal().toText());
        setIsAuthenticated(true);

        // Create an actor using the authenticated identity
        const agent = new HttpAgent({ identity });
        const actor = Actor.createActor(threeMail_backend_idl, {
          agent,
          canisterId: threeMail_backend_id,
        });
        setThreeMailActor(actor);
      }
    }
    initAuth();
  }, []);

  const handleLogin = async () => {
    if (authClient) {
      await authClient.login({
        identityProvider: "https://identity.ic0.app",
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          setPrincipal(identity.getPrincipal().toText());
          setIsAuthenticated(true);

          // Create an actor using the authenticated identity
          const agent = new HttpAgent({ identity });
          const actor = Actor.createActor(threeMail_backend_idl, {
            agent,
            canisterId: threeMail_backend_id,
          });
          setThreeMailActor(actor);
        }
      });
    }
  };

  const handleLogout = async () => {
    if (authClient) {
      await authClient.logout();
      setIsAuthenticated(false);
      setPrincipal('');
      setMessages([]);
      setThreeMailActor(null);
    }
  };

  const handleGetMessages = async () => {
    try {
      if (threeMailActor) {
        let userMessages = await threeMailActor.getMyMessages();
        // Sort messages so that the newest ones are first
        userMessages = userMessages.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        setMessages(userMessages);
      }
    } catch (error) {
      console.error("Error retrieving messages:", error);
    }
  };

  const handleGetUnviewedMessages = async () => {
    try {
      if (threeMailActor) {
        let userMessages = await threeMailActor.getUnviewedMessages();
        // Sort messages so that the newest ones are first
        userMessages = userMessages.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        setMessages(userMessages);
      }
    } catch (error) {
      console.error("Error retrieving unviewed messages:", error);
    }
  };

  const handleGetSentMessages = async () => {
    try {
      if (threeMailActor) {
        let sentMessages = await threeMailActor.getSentMessages();
        // Sort messages so that the newest ones are first
        sentMessages = sentMessages.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        setMessages(sentMessages);
      }
    } catch (error) {
      console.error("Error retrieving sent messages:", error);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    try {
      if (threeMailActor) {
        const recipientPrincipal = Principal.fromText(recipient);
        const result = await threeMailActor.submitMessage(recipientPrincipal, subject, messageBody);
        setResponse(result);
        setRecipient('');  // Clear the recipient field after sending
        setSubject('');     // Clear the subject field after sending
        setMessageBody(''); // Clear the message field after sending
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setResponse("Failed to send message.");
    }
  };

  const handleDeleteMessage = async (subject) => {
    try {
      if (threeMailActor) {
        const result = await threeMailActor.deleteMessage(subject);
        setResponse(result);
        // Refresh the message list after deletion
        handleGetMessages();
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleMarkAsViewed = async (subject) => {
    try {
      if (threeMailActor) {
        const result = await threeMailActor.markAsViewed(subject);
        setResponse(result);
        // Refresh the message list after marking as viewed
        handleGetMessages();
      }
    } catch (error) {
      console.error("Error marking message as viewed:", error);
    }
  };

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', margin: '20px' }}>
      <h1>3Mail</h1>
      <h2>on ICP</h2>
      {!isAuthenticated ? (
        <button onClick={handleLogin} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Log in with Internet Identity
        </button>
      ) : (
        <div>
          <p>Your 3Mail ID - {principal}</p>
          <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Logout
          </button>
          <div style={{ marginTop: '20px' }}>
            <h2>Send a Message</h2>
            <form onSubmit={handleSendMessage} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <label>Recipient PID:</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  style={{ padding: '5px', width: '300px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <label>Subject:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ padding: '5px', width: '300px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <label>Message:</label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  style={{ padding: '5px', width: '300px', height: '100px' }}
                />
              </div>
              <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', alignSelf: 'flex-start' }}>Send Message</button>
            </form>
            {response && <p>{response}</p>}
          </div>
          <button onClick={handleGetMessages} style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '20px' }}>
            Get My Messages
          </button>
          <button onClick={handleGetUnviewedMessages} style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '20px', marginLeft: '10px' }}>
            Get Unviewed Messages
          </button>
          <button onClick={handleGetSentMessages} style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '20px', marginLeft: '10px' }}>
            Get Sent Messages
          </button>
          {messages.length > 0 && (
            <div style={{ maxHeight: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px', marginTop: '20px' }}>
              {messages.map((msg, index) => (
                <div key={index} style={{ marginBottom: '10px', padding: '10px', borderBottom: '1px solid #ccc' }}>
                  <strong>From:</strong> {msg.sender.toText()}<br />
                  <strong>Subject:</strong> {msg.subject}<br />
                  <strong>Message:</strong> {msg.message}<br />
                  <strong>Timestamp:</strong> {new Date(Number(msg.timestamp / 1000000n)).toLocaleString()}<br />
                  <button onClick={() => handleMarkAsViewed(msg.subject)} style={{ marginLeft: '10px', cursor: 'pointer' }}>Mark as Viewed</button>
                  <button onClick={() => handleDeleteMessage(msg.subject)} style={{ marginLeft: '10px', cursor: 'pointer' }}>Delete</button>
                </div>
              ))}
            </div>
          )}

          {/* Advertisement Spot */}
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <h3>Brought to you by</h3>
            <a href="https://3jorm-yqaaa-aaaam-aaa6a-cai.ic0.app/index-gaming.html" target="_blank" rel="noopener noreferrer">
              <img src="/images/advertisement.png" alt="Advertisement" style={{ maxWidth: '100%', height: 'auto' }} />
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
