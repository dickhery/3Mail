import Array "mo:base/Array";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

actor class Mailbox() = this {
  type Message = {
    sender : Principal;
    senderCustomAddress : Text;
    recipient : Principal;
    recipientCustomAddress : Text;
    subject : Text;
    message : Text;
    timestamp : Time.Time;
    viewed : Bool;
  };

  stable var messages : [Message] = [];
  stable var totalMessagesSent : Nat = 0;
  stable var usernames : [(Principal, Text)] = [];

  public shared (msg) func submitMessage(recipient : Principal, subject : Text, message : Text) : async Text {
    let sender = msg.caller;

    // Get sender's custom address or use PID if not available
    let senderCustomAddress: Text = switch (await getCustomAddressOrPID(sender)) {
      case (?address) address;
      case null "";
    };

    // Get recipient's custom address or use PID if not available
    let recipientCustomAddress: Text = switch (await getCustomAddressOrPID(recipient)) {
      case (?address) address;
      case null "";
    };

    let timestamp = Time.now();

    // Create the new message
    let newMessage = {
      sender = sender;
      senderCustomAddress = senderCustomAddress;
      recipient = recipient;
      recipientCustomAddress = recipientCustomAddress;
      subject = subject;
      message = message;
      timestamp = timestamp;
      viewed = false;
    };

    // Append the new message to the messages array
    messages := Array.append<Message>(messages, [newMessage]);
    totalMessagesSent += 1;
    return "Message submitted successfully.";
  };

  public shared (msg) func getMyMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(
      messages,
      func(m) : Bool {
        m.recipient == caller;
      },
    );
    return sortMessagesByTimestamp(results);
  };

  public shared (msg) func getUnviewedMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(
      messages,
      func(m) : Bool {
        not m.viewed and m.recipient == caller
      },
    );
    return sortMessagesByTimestamp(results);
  };

  public shared (msg) func getSentMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(
      messages,
      func(m) : Bool {
        m.sender == caller;
      },
    );
    return sortMessagesByTimestamp(results);
  };

  public shared (msg) func markAsViewed(timestamp : Time.Time) : async Text {
    let caller = msg.caller;
    var found = false;
    messages := Array.map<Message, Message>(
      messages,
      func(m) : Message {
        if (m.timestamp == timestamp and m.recipient == caller) {
          found := true;
          { m with viewed = true };
        } else {
          m;
        };
      },
    );
    if (found) {
      return "Message marked as viewed.";
    } else {
      return "Message not found or unauthorized.";
    }
  };

  public shared (msg) func deleteMessage(timestamp : Time.Time) : async Text {
    let caller = msg.caller;
    let initialLength = Array.size<Message>(messages);
    messages := Array.filter<Message>(
      messages,
      func(m) : Bool {
        not (m.timestamp == timestamp and (m.recipient == caller or m.sender == caller));
      },
    );
    if (Array.size<Message>(messages) < initialLength) {
      return "Message deleted successfully.";
    } else {
      return "Message not found or unauthorized.";
    }
  };

  public shared (msg) func deleteAllMessages() : async Text {
    let caller = msg.caller;
    let initialLength = Array.size<Message>(messages);
    messages := Array.filter<Message>(
      messages,
      func(m) : Bool {
        m.recipient != caller and m.sender != caller;
      },
    );
    let deletedCount = initialLength - Array.size<Message>(messages);
    if (deletedCount > 0) {
      return "All messages deleted successfully.";
    } else {
      return "No messages to delete or unauthorized.";
    }
  };

  public shared (msg) func searchBySubject(subject : Text) : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(
      messages,
      func(m) : Bool {
        m.subject == subject and (m.sender == caller or m.recipient == caller);
      },
    );
    return sortMessagesByTimestamp(results);
  };

  public shared (msg) func getTotalMessages() : async Nat {
    let caller = msg.caller;
    let receivedMessages = Array.filter<Message>(
      messages,
      func(m) : Bool {
        m.recipient == caller;
      },
    );
    return Array.size<Message>(receivedMessages);
  };

  public shared (msg) func getTotalMessagesSent() : async Nat {
    return totalMessagesSent;
  };

  public shared (msg) func setUsername(newUsername : Text) : async Bool {
    let caller : Principal = msg.caller;
    let lowerUsername = Text.toLowercase(newUsername);

    let usernameExists = Array.find<(Principal, Text)>(
      usernames,
      func(entry : (Principal, Text)) : Bool {
        Text.toLowercase(entry.1) == lowerUsername;
      },
    ) != null;

    if (usernameExists) {
      return false;
    } else {
      usernames := Array.filter(usernames, func(entry : (Principal, Text)) : Bool { entry.0 != caller });
      usernames := Array.append(usernames, [(caller, newUsername)]);
      return true;
    };
  };

  public query func getCustomAddress(userId : Principal) : async ?{ customAddress: Text; principal: Principal } {
    let result = Array.find<(Principal, Text)>(
      usernames,
      func(entry : (Principal, Text)) : Bool {
        entry.0 == userId;
      },
    );
    return switch result {
      case (?entry) ?{ customAddress = entry.1; principal = entry.0 };
      case null null;
    };
  };

  public query func resolveCustomAddress(customAddress : Text) : async ?Principal {
    let lowerCustomAddress = Text.toLowercase(customAddress);
    let result = Array.find<(Principal, Text)>(
      usernames,
      func(entry : (Principal, Text)) : Bool {
        Text.toLowercase(entry.1) == lowerCustomAddress;
      },
    );
    return switch result {
      case (?entry) ?entry.0;
      case null null;
    };
  };

  private func getCustomAddressOrPID(userId : Principal) : async ?Text {
    let result = await getCustomAddress(userId);
    switch result {
      case (?data) ?data.customAddress;
      case null null;
    }
  };

  type CustomOrder = {
    #less;
    #equal;
    #greater;
  };

  func compareTimestamps(a : Time.Time, b : Time.Time) : CustomOrder {
    if (a < b) {
      return #greater;
    } else if (a > b) {
      return #less;
    } else {
      return #equal;
    };
  };

  func sortMessagesByTimestamp(messages : [Message]) : [Message] {
    return Array.sort<Message>(
      messages,
      func(a, b) : CustomOrder {
        compareTimestamps(a.timestamp, b.timestamp);
      },
    );
  };
};
