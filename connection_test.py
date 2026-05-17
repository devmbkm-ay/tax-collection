import imaplib

imap_server = "imap.gmail.com"

email = input("Email Gmail: ")
password = input("App Password: ")

mail = imaplib.IMAP4_SSL(imap_server)

mail.login(email, password)

print("Connexion Gmail réussie ✅")