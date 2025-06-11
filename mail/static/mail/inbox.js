document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Mail Submission
  document.querySelector('#compose-form').addEventListener('submit', send_mail);
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#detail-view').style.display = 'none';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_mail(event)
{
  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  
  fetch('/emails', {
    method : 'POST',
    body : JSON.stringify({
      recipients : recipients,
      subject : subject,
      body : body
    })
  })
  .then(response => response.json())
  .then(result => {
    if(result.error)
    {
      alert(result.error);
    }
    else
    {
      alert(result.message);
      load_mailbox('sent');
    }
  })
  .catch(error => {
    alert("An unexpected error has occured");
    console.error("Error:", error);
  }
  )
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'none';

  // Show the mailbox name
  const view = document.querySelector('#emails-view');
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      let div = document.createElement('div');
      div.className = `list-group-item border border-dark ${email.read ? 'read' : 'unread'}`
      div.innerHTML = `
        <div class="d-flex justify-content-between">
          <span class="sender col-3"> <b>${email['sender']}</b> </span>
          <span class="subject col-6"> ${email['subject']} </span>
          <span class="timestamp col-9 text-end"> ${email['timestamp']} </span>
        <div>
      `;
      view.appendChild(div);
      div.addEventListener('click', () => view_detail(email.id));
    })
  })
}

function view_detail(id)
{
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'block';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector("#detail-view").innerHTML = `
      <ul class="list-group">
        <li class="list-group-item"><strong>From: </strong>${email.sender}</li>
        <li class="list-group-item"><strong>To: </strong>${email.recipients}</li>
        <li class="list-group-item"><strong>Subject: </strong>${email.subject}</li>
        <li class="list-group-item"><strong>Timestamp: </strong>${email.timestamp}</li>
      </ul>
      <p class="m-2">${email.body}</p><br><br>
    `;

    if(!email.read)
    {
      fetch(`/emails/${id}`, {
        method : 'PUT',
        body : JSON.stringify({
          read : true
        })
      })
    }

    const archive = document.createElement('button');
    archive.innerHTML = `${email.archived ? 'Unarchive' : 'Archive'}`;
    archive.className = email.archived ? 'btn btn-danger' : 'btn btn-success';
    archive.addEventListener('click', function() {
      fetch(`/emails/${id}`, {
        method : 'PUT',
        body : JSON.stringify({
          archived : !email.archived
        })
      }).then(() => load_mailbox('archive'))
    })
    document.querySelector("#detail-view").append(archive);

    const reply = document.createElement('button');
    reply.innerHTML = 'Reply';
    reply.className = 'btn btn-info';
    reply.addEventListener('click', function() {
      compose_email();

      document.querySelector('#compose-recipients').value = email.sender;

      let subject = email.subject;
      if(subject.split(' ',1)[0] != 'Re:')
      {
        subject = 'Re: ' + subject;
      }
      document.querySelector('#compose-subject').value = subject;

      let body = `On ${email.timestamp}, ${email.sender} wrote: ${email.body} `
      document.querySelector('#compose-body').value = body;
    })
    document.querySelector("#detail-view").append("  ");
    document.querySelector("#detail-view").append(reply);
  })
}


