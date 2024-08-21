import Array "mo:base/Array";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";

actor class Mailbox() = this {
  type Message = {
    sender: Principal;
    recipient: Principal;
    subject: Text;
    message: Text;
    timestamp: Time.Time;
    viewed: Bool;
  };

  stable var messages: [Message] = [];
  stable var totalMessagesSent: Nat = 0;

  public shared(msg) func submitMessage(recipient: Principal, subject: Text, message: Text) : async Text {
    let sender = msg.caller;
    let timestamp = Time.now();
    let newMessage = {
      sender = sender;
      recipient = recipient;
      subject = subject;
      message = message;
      timestamp = timestamp;
      viewed = false;
    };
    messages := Array.append<Message>(messages, [newMessage]);
    totalMessagesSent += 1;
    return "Message submitted successfully.";
  };

  public shared(msg) func getTotalMessages() : async Nat {
    let caller = msg.caller;
    let receivedMessages = Array.filter<Message>(messages, func (m) : Bool {
      m.recipient == caller
    });
    return Array.size<Message>(receivedMessages);
  };

  public shared(msg) func getTotalMessagesSent() : async Nat {
    return totalMessagesSent;
  };

  public shared(msg) func getMyMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      m.recipient == caller
    });
    return sortMessagesByTimestamp(results);
  };

  public shared(msg) func getUnviewedMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      not m.viewed and m.recipient == caller
    });
    return sortMessagesByTimestamp(results);
  };

  public shared(msg) func getSentMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      m.sender == caller
    });
    return sortMessagesByTimestamp(results);
  };

  public shared(msg) func markAsViewed(subject: Text) : async Text {
    let caller = msg.caller;
    var found = false;
    messages := Array.map<Message, Message>(messages, func (m) : Message {
      if (m.subject == subject and m.recipient == caller) {
        found := true;
        {m with viewed = true};
      } else {
        m;
      }
    });
    if (found) {
      return "Message marked as viewed.";
    } else {
      return "Message not found or unauthorized.";
    }
  };

  public shared(msg) func deleteMessage(subject: Text) : async Text {
    let caller = msg.caller;
    let initialLength = Array.size<Message>(messages);
    messages := Array.filter<Message>(messages, func (m) : Bool {
      not (m.subject == subject and m.recipient == caller)
    });
    if (Array.size<Message>(messages) < initialLength) {
      return "Message deleted successfully.";
    } else {
      return "Message not found or unauthorized.";
    }
  };

  public shared(msg) func deleteAllMessages() : async Text {
    let caller = msg.caller;
    let initialLength = Array.size<Message>(messages);
    messages := Array.filter<Message>(messages, func (m) : Bool {
      m.recipient != caller
    });
    let deletedCount = initialLength - Array.size<Message>(messages);
    if (deletedCount > 0) {
      return "All messages deleted successfully.";
    } else {
      return "No messages to delete or unauthorized.";
    }
  };

  public shared(msg) func searchBySubject(subject: Text) : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      m.subject == subject and (m.sender == caller or m.recipient == caller)
    });
    return sortMessagesByTimestamp(results);
  };

  // Custom sorting function with custom order type
  type CustomOrder = {
    #less;
    #equal;
    #greater;
  };

  func compareTimestamps(a: Time.Time, b: Time.Time) : CustomOrder {
    if (a < b) {
      return #greater;
    } else if (a > b) {
      return #less;
    } else {
      return #equal;
    }
  };

  func sortMessagesByTimestamp(messages: [Message]) : [Message] {
    return Array.sort<Message>(messages, func (a, b) : CustomOrder {
      compareTimestamps(a.timestamp, b.timestamp)
    });
  };
};
