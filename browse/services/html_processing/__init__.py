from flask import render_template, url_for
from datetime import datetime
import re
import typing
import urllib.parse
import arxiv.document.exceptions
from arxiv.identifier import Identifier, IdentifierException
from arxiv.document.metadata import DocMetadata
from arxiv.files import FileObj, FileTransform
from browse.services.documents import get_doc_service
from browse.controllers.list_page import dl_for_article, latexml_links_for_article, authors_for_article
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

LAX_ID_REGEX = b'(arXiv:)?([a-z-]+(\.[A-Z][A-Z])?\/\d{7}|\d{4}\.\d{4,5})(v\d+)?'

def post_process_html(byte_line:bytes) -> bytes:
    """Transformes each `byte_line` with the HTML post processing to
    add in any ABS or LIST lines.

    If this is run after the app code returns, say with
    `make_response(post_process_html(somefile))` this needs to be used with
    `flask.stream_with_context`.
    """
    #line=byte_line.decode('utf-8')
    # Match LIST: or ABS: directives followed by an identifier using regular expressions
    list_match = re.match(b'(LIST|ABS):(' + LAX_ID_REGEX + b')', byte_line, re.I)
    report_no_match = re.match(b'^\s*REPORT-NO:([A-Za-z0-9-\/]+)', byte_line, re.I)
    if list_match:
        try:
            cmd = list_match.group(1) #which command to perform
            if cmd==b'ABS':
                include_abstract=True
            else:
                include_abstract=False
            id = list_match.group(2).decode('utf-8') #document ID
            arxiv_id=Identifier(id)

            new_html = "<dl>\n"

            if arxiv_id:
                #get and format metadata here as html
                metadata=get_doc_service().get_abs(arxiv_id)
                downloads= dl_for_article(metadata)
                latexml=latexml_links_for_article(metadata)
                author_links=authors_for_article(metadata)
                item_string=render_template('list/conference_item.html',
                                            item=metadata,
                                            include_abstract=include_abstract,
                                            downloads=downloads,
                                            latexml=latexml,
                                            author_links=author_links,
                                            url_for_author_search=author_query )

                new_html+= item_string
            else:
                new_html += f"<dd>{id} [failed to get identifier for paper]</dd>\n"

            new_html += "</dl>\n"
            new_bytes=new_html.encode('utf-8')
        except (arxiv.document.exceptions.AbsException, IdentifierException ) as ee:
            new_bytes = byte_line
            logger.error(f"Source of html paper had a problem during post_process_html: {ee}")

    elif report_no_match: #need to find proceeding to test with
        rn = report_no_match.group(1).decode('utf-8')
        url_encoded_rn = urllib.parse.quote(rn,safe="")
        new_html=f"<a href=\"/search/?searchtype=report_num&query={url_encoded_rn}\">{rn}</a>\n"
        new_bytes=new_html.encode('utf-8')
    else:
        new_bytes = byte_line
    return new_bytes

def author_query(article: DocMetadata, query: str)->str:
    return str(url_for('search_box', searchtype='author', query=query))

# This is a stateless transform that can insert scaffolding at the usual global markup transition points.
def render_branded_html_paper(byte_line:bytes, state: str, abs_meta: DocMetadata) -> bytes:
    """ We brand and post-process the latexml-generated HTML asset, to allow for change management
        of branded materials within arxiv-browse itself.
        
        The HTML assets from latexml include a single versioned CSS and JS asset, each of which served
        from browse, and coordinated with a LaTeXML version/release. Logic depending on latexml markup
        belongs either in latexml, in our conversion worker or in the CSS/JS assets, not here.

        arXiv-branded headers, footers, etc are added here.
    """
    if state == 'head':
        if re.search(b'</head>$', byte_line, re.I):
            # insert new head mixins before </head>
            return ('head_end', \
                render_template("dissemination/html_scaffold_head_mixins.html", abs_meta=abs_meta)
                .encode('utf-8') + byte_line)
        elif re.match(b'<(link|script) ', byte_line, re.I) and \
            re.search(b'(?:addons_new|bootstrap\.bundle\.min|html2canvas\.min|feedbackOverlay)\.js', byte_line):
            # pre 02.2026, we used JS rewrites and just returned the GCP bucket HTML content directly
            # For backwards compatibility: we remove those assets to avoid conflicts. Ideally these gradually
            #     fade out as we reconvert the entire collection with the latest LaTeXML recipe.
            return (state, b'')
        else:
            # pass through all other lines unmodified
            return (state, byte_line)
    elif state == 'head_end' and re.match(b'<body>', byte_line, re.I):
        return ('body', \
            byte_line + render_template("dissemination/html_scaffold_header.html", abs_meta=abs_meta)
            .encode('utf-8'))
    elif state.startswith('body'):
        if state == 'body' and re.match(b'\s*<div class="ltx_page_content"', byte_line, re.I):
            return ('body_content', \
                render_template("dissemination/html_scaffold_callout_license.html", abs_meta=abs_meta)
                .encode('utf-8') + byte_line)
        elif state == 'body_footer': # skip the original latexml footer, we render an arXiv one
            if re.search(b'</footer>$', byte_line, re.I):
                return ('body_content', '')
            else: 
                return ('body_footer', '')
        elif state == 'body_content':
            if re.match(b'<footer', byte_line, re.I):
                return ('body_footer', '')
            elif re.match(b'</body>', byte_line, re.I):
                return ('body_end', \
                    render_template("dissemination/html_scaffold_footer.html", abs_meta=abs_meta)
                    .encode('utf-8') + byte_line)
        else:
            # pass through all other lines unmodified
            return (state, byte_line)
    # pass through all other lines unmodified
    return (state, byte_line)

# This helper belongs in arxiv-base
def license_url_to_str_mapping(url: str | None) -> str:
        if not url:
            return "No License"
        elif url == "http://arxiv.org/licenses/nonexclusive-distrib/1.0/":
            license = "arXiv.org perpetual non-exclusive license"
        elif url == "http://creativecommons.org/licenses/by-nc-nd/4.0/":
            license = "CC BY-NC-ND 4.0"
        elif url == "http://creativecommons.org/licenses/by-sa/4.0/":
            license = "CC BY-SA 4.0"
        elif (
            url == "http://creativecommons.org/publicdomain/zero/1.0/"
            or url == "http://creativecommons.org/licenses/publicdomain/"
        ):
            license = "CC Zero"
        elif match := re.match(r"http:\/\/creativecommons\.org\/licenses\/by-nc-sa\/(\d\.0)\/", url):
            license = f"CC BY-NC-SA {match.group(1)}"
        elif match := re.match(r"http:\/\/creativecommons\.org\/licenses\/by\/(\d\.0)\/", url):
            license = f"CC BY {match.group(1)}"
        return f"License: {license}"

class HTMLFileTransform(FileTransform):
    """ A stateful `FileTransform` that applies HTML post-processing and branding to HTML papers.
        We track the state of the HTML asset being transformed in this object, to minimize regex overhead.

        Note: Depends on DB access to get metadata for licensing header.
    """
    def __init__(self, file: FileObj, transform_fn: typing.Callable[[bytes, str, DocMetadata], bytes], abs_meta: DocMetadata):
        self.fileobj = file
        self.transform_fn = transform_fn
        self.abs_meta = abs_meta
        abs_meta.license.short_label = license_url_to_str_mapping(abs_meta.license.recorded_uri)
        self.transform_state = 'head' # initial transform state

    def transform(self, data: bytes) -> bytes:
        (new_state, new_data) = self.transform_fn(data, self.transform_state, self.abs_meta)
        self.transform_state = new_state
        return new_data