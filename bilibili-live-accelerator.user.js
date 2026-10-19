// ==UserScript==
// @name         Bilibili Live Accelerator
// @name:zh-CN   B站直播加速器
// @namespace    local.bilibili-live-accelerator
// @version      0.2.0
// @author       Yueliangxi
// @description  Same-quality FLV preference, official CDN choices and classified playback diagnostics. No telemetry.
// @description:zh-CN 同画质 FLV 优先、官方线路选择、短暂停顿与掉帧分类记录。无测速抢带宽、无诊断上报。
// @homepageURL  https://github.com/Yueliangxi/Bilibili_Live_Accelerator
// @supportURL   https://github.com/Yueliangxi/Bilibili_Live_Accelerator/issues
// @source       https://github.com/Yueliangxi/Bilibili_Live_Accelerator
// @updateURL    https://raw.githubusercontent.com/Yueliangxi/Bilibili_Live_Accelerator/main/bilibili-live-accelerator.meta.js
// @downloadURL  https://raw.githubusercontent.com/Yueliangxi/Bilibili_Live_Accelerator/main/bilibili-live-accelerator.user.js
// @match        https://live.bilibili.com/*
// @run-at       document-start
// @noframes
// @grant        none
// @sandbox      raw
// @license      GPL-3.0-only
// ==/UserScript==

/*
                    GNU GENERAL PUBLIC LICENSE
                       Version 3, 29 June 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The GNU General Public License is a free, copyleft license for
software and other kinds of works.

  The licenses for most software and other practical works are designed
to take away your freedom to share and change the works.  By contrast,
the GNU General Public License is intended to guarantee your freedom to
share and change all versions of a program--to make sure it remains free
software for all its users.  We, the Free Software Foundation, use the
GNU General Public License for most of our software; it applies also to
any other work released this way by its authors.  You can apply it to
your programs, too.

  When we speak of free software, we are referring to freedom, not
price.  Our General Public Licenses are designed to make sure that you
have the freedom to distribute copies of free software (and charge for
them if you wish), that you receive source code or can get it if you
want it, that you can change the software or use pieces of it in new
free programs, and that you know you can do these things.

  To protect your rights, we need to prevent others from denying you
these rights or asking you to surrender the rights.  Therefore, you have
certain responsibilities if you distribute copies of the software, or if
you modify it: responsibilities to respect the freedom of others.

  For example, if you distribute copies of such a program, whether
gratis or for a fee, you must pass on to the recipients the same
freedoms that you received.  You must make sure that they, too, receive
or can get the source code.  And you must show them these terms so they
know their rights.

  Developers that use the GNU GPL protect your rights with two steps:
(1) assert copyright on the software, and (2) offer you this License
giving you legal permission to copy, distribute and/or modify it.

  For the developers' and authors' protection, the GPL clearly explains
that there is no warranty for this free software.  For both users' and
authors' sake, the GPL requires that modified versions be marked as
changed, so that their problems will not be attributed erroneously to
authors of previous versions.

  Some devices are designed to deny users access to install or run
modified versions of the software inside them, although the manufacturer
can do so.  This is fundamentally incompatible with the aim of
protecting users' freedom to change the software.  The systematic
pattern of such abuse occurs in the area of products for individuals to
use, which is precisely where it is most unacceptable.  Therefore, we
have designed this version of the GPL to prohibit the practice for those
products.  If such problems arise substantially in other domains, we
stand ready to extend this provision to those domains in future versions
of the GPL, as needed to protect the freedom of users.

  Finally, every program is threatened constantly by software patents.
States should not allow patents to restrict development and use of
software on general-purpose computers, but in those that do, we wish to
avoid the special danger that patents applied to a free program could
make it effectively proprietary.  To prevent this, the GPL assures that
patents cannot be used to render the program non-free.

  The precise terms and conditions for copying, distribution and
modification follow.

                       TERMS AND CONDITIONS

  0. Definitions.

  "This License" refers to version 3 of the GNU General Public License.

  "Copyright" also means copyright-like laws that apply to other kinds of
works, such as semiconductor masks.

  "The Program" refers to any copyrightable work licensed under this
License.  Each licensee is addressed as "you".  "Licensees" and
"recipients" may be individuals or organizations.

  To "modify" a work means to copy from or adapt all or part of the work
in a fashion requiring copyright permission, other than the making of an
exact copy.  The resulting work is called a "modified version" of the
earlier work or a work "based on" the earlier work.

  A "covered work" means either the unmodified Program or a work based
on the Program.

  To "propagate" a work means to do anything with it that, without
permission, would make you directly or secondarily liable for
infringement under applicable copyright law, except executing it on a
computer or modifying a private copy.  Propagation includes copying,
distribution (with or without modification), making available to the
public, and in some countries other activities as well.

  To "convey" a work means any kind of propagation that enables other
parties to make or receive copies.  Mere interaction with a user through
a computer network, with no transfer of a copy, is not conveying.

  An interactive user interface displays "Appropriate Legal Notices"
to the extent that it includes a convenient and prominently visible
feature that (1) displays an appropriate copyright notice, and (2)
tells the user that there is no warranty for the work (except to the
extent that warranties are provided), that licensees may convey the
work under this License, and how to view a copy of this License.  If
the interface presents a list of user commands or options, such as a
menu, a prominent item in the list meets this criterion.

  1. Source Code.

  The "source code" for a work means the preferred form of the work
for making modifications to it.  "Object code" means any non-source
form of a work.

  A "Standard Interface" means an interface that either is an official
standard defined by a recognized standards body, or, in the case of
interfaces specified for a particular programming language, one that
is widely used among developers working in that language.

  The "System Libraries" of an executable work include anything, other
than the work as a whole, that (a) is included in the normal form of
packaging a Major Component, but which is not part of that Major
Component, and (b) serves only to enable use of the work with that
Major Component, or to implement a Standard Interface for which an
implementation is available to the public in source code form.  A
"Major Component", in this context, means a major essential component
(kernel, window system, and so on) of the specific operating system
(if any) on which the executable work runs, or a compiler used to
produce the work, or an object code interpreter used to run it.

  The "Corresponding Source" for a work in object code form means all
the source code needed to generate, install, and (for an executable
work) run the object code and to modify the work, including scripts to
control those activities.  However, it does not include the work's
System Libraries, or general-purpose tools or generally available free
programs which are used unmodified in performing those activities but
which are not part of the work.  For example, Corresponding Source
includes interface definition files associated with source files for
the work, and the source code for shared libraries and dynamically
linked subprograms that the work is specifically designed to require,
such as by intimate data communication or control flow between those
subprograms and other parts of the work.

  The Corresponding Source need not include anything that users
can regenerate automatically from other parts of the Corresponding
Source.

  The Corresponding Source for a work in source code form is that
same work.

  2. Basic Permissions.

  All rights granted under this License are granted for the term of
copyright on the Program, and are irrevocable provided the stated
conditions are met.  This License explicitly affirms your unlimited
permission to run the unmodified Program.  The output from running a
covered work is covered by this License only if the output, given its
content, constitutes a covered work.  This License acknowledges your
rights of fair use or other equivalent, as provided by copyright law.

  You may make, run and propagate covered works that you do not
convey, without conditions so long as your license otherwise remains
in force.  You may convey covered works to others for the sole purpose
of having them make modifications exclusively for you, or provide you
with facilities for running those works, provided that you comply with
the terms of this License in conveying all material for which you do
not control copyright.  Those thus making or running the covered works
for you must do so exclusively on your behalf, under your direction
and control, on terms that prohibit them from making any copies of
your copyrighted material outside their relationship with you.

  Conveying under any other circumstances is permitted solely under
the conditions stated below.  Sublicensing is not allowed; section 10
makes it unnecessary.

  3. Protecting Users' Legal Rights From Anti-Circumvention Law.

  No covered work shall be deemed part of an effective technological
measure under any applicable law fulfilling obligations under article
11 of the WIPO copyright treaty adopted on 20 December 1996, or
similar laws prohibiting or restricting circumvention of such
measures.

  When you convey a covered work, you waive any legal power to forbid
circumvention of technological measures to the extent such circumvention
is effected by exercising rights under this License with respect to
the covered work, and you disclaim any intention to limit operation or
modification of the work as a means of enforcing, against the work's
users, your or third parties' legal rights to forbid circumvention of
technological measures.

  4. Conveying Verbatim Copies.

  You may convey verbatim copies of the Program's source code as you
receive it, in any medium, provided that you conspicuously and
appropriately publish on each copy an appropriate copyright notice;
keep intact all notices stating that this License and any
non-permissive terms added in accord with section 7 apply to the code;
keep intact all notices of the absence of any warranty; and give all
recipients a copy of this License along with the Program.

  You may charge any price or no price for each copy that you convey,
and you may offer support or warranty protection for a fee.

  5. Conveying Modified Source Versions.

  You may convey a work based on the Program, or the modifications to
produce it from the Program, in the form of source code under the
terms of section 4, provided that you also meet all of these conditions:

    a) The work must carry prominent notices stating that you modified
    it, and giving a relevant date.

    b) The work must carry prominent notices stating that it is
    released under this License and any conditions added under section
    7.  This requirement modifies the requirement in section 4 to
    "keep intact all notices".

    c) You must license the entire work, as a whole, under this
    License to anyone who comes into possession of a copy.  This
    License will therefore apply, along with any applicable section 7
    additional terms, to the whole of the work, and all its parts,
    regardless of how they are packaged.  This License gives no
    permission to license the work in any other way, but it does not
    invalidate such permission if you have separately received it.

    d) If the work has interactive user interfaces, each must display
    Appropriate Legal Notices; however, if the Program has interactive
    interfaces that do not display Appropriate Legal Notices, your
    work need not make them do so.

  A compilation of a covered work with other separate and independent
works, which are not by their nature extensions of the covered work,
and which are not combined with it such as to form a larger program,
in or on a volume of a storage or distribution medium, is called an
"aggregate" if the compilation and its resulting copyright are not
used to limit the access or legal rights of the compilation's users
beyond what the individual works permit.  Inclusion of a covered work
in an aggregate does not cause this License to apply to the other
parts of the aggregate.

  6. Conveying Non-Source Forms.

  You may convey a covered work in object code form under the terms
of sections 4 and 5, provided that you also convey the
machine-readable Corresponding Source under the terms of this License,
in one of these ways:

    a) Convey the object code in, or embodied in, a physical product
    (including a physical distribution medium), accompanied by the
    Corresponding Source fixed on a durable physical medium
    customarily used for software interchange.

    b) Convey the object code in, or embodied in, a physical product
    (including a physical distribution medium), accompanied by a
    written offer, valid for at least three years and valid for as
    long as you offer spare parts or customer support for that product
    model, to give anyone who possesses the object code either (1) a
    copy of the Corresponding Source for all the software in the
    product that is covered by this License, on a durable physical
    medium customarily used for software interchange, for a price no
    more than your reasonable cost of physically performing this
    conveying of source, or (2) access to copy the
    Corresponding Source from a network server at no charge.

    c) Convey individual copies of the object code with a copy of the
    written offer to provide the Corresponding Source.  This
    alternative is allowed only occasionally and noncommercially, and
    only if you received the object code with such an offer, in accord
    with subsection 6b.

    d) Convey the object code by offering access from a designated
    place (gratis or for a charge), and offer equivalent access to the
    Corresponding Source in the same way through the same place at no
    further charge.  You need not require recipients to copy the
    Corresponding Source along with the object code.  If the place to
    copy the object code is a network server, the Corresponding Source
    may be on a different server (operated by you or a third party)
    that supports equivalent copying facilities, provided you maintain
    clear directions next to the object code saying where to find the
    Corresponding Source.  Regardless of what server hosts the
    Corresponding Source, you remain obligated to ensure that it is
    available for as long as needed to satisfy these requirements.

    e) Convey the object code using peer-to-peer transmission, provided
    you inform other peers where the object code and Corresponding
    Source of the work are being offered to the general public at no
    charge under subsection 6d.

  A separable portion of the object code, whose source code is excluded
from the Corresponding Source as a System Library, need not be
included in conveying the object code work.

  A "User Product" is either (1) a "consumer product", which means any
tangible personal property which is normally used for personal, family,
or household purposes, or (2) anything designed or sold for incorporation
into a dwelling.  In determining whether a product is a consumer product,
doubtful cases shall be resolved in favor of coverage.  For a particular
product received by a particular user, "normally used" refers to a
typical or common use of that class of product, regardless of the status
of the particular user or of the way in which the particular user
actually uses, or expects or is expected to use, the product.  A product
is a consumer product regardless of whether the product has substantial
commercial, industrial or non-consumer uses, unless such uses represent
the only significant mode of use of the product.

  "Installation Information" for a User Product means any methods,
procedures, authorization keys, or other information required to install
and execute modified versions of a covered work in that User Product from
a modified version of its Corresponding Source.  The information must
suffice to ensure that the continued functioning of the modified object
code is in no case prevented or interfered with solely because
modification has been made.

  If you convey an object code work under this section in, or with, or
specifically for use in, a User Product, and the conveying occurs as
part of a transaction in which the right of possession and use of the
User Product is transferred to the recipient in perpetuity or for a
fixed term (regardless of how the transaction is characterized), the
Corresponding Source conveyed under this section must be accompanied
by the Installation Information.  But this requirement does not apply
if neither you nor any third party retains the ability to install
modified object code on the User Product (for example, the work has
been installed in ROM).

  The requirement to provide Installation Information does not include a
requirement to continue to provide support service, warranty, or updates
for a work that has been modified or installed by the recipient, or for
the User Product in which it has been modified or installed.  Access to a
network may be denied when the modification itself materially and
adversely affects the operation of the network or violates the rules and
protocols for communication across the network.

  Corresponding Source conveyed, and Installation Information provided,
in accord with this section must be in a format that is publicly
documented (and with an implementation available to the public in
source code form), and must require no special password or key for
unpacking, reading or copying.

  7. Additional Terms.

  "Additional permissions" are terms that supplement the terms of this
License by making exceptions from one or more of its conditions.
Additional permissions that are applicable to the entire Program shall
be treated as though they were included in this License, to the extent
that they are valid under applicable law.  If additional permissions
apply only to part of the Program, that part may be used separately
under those permissions, but the entire Program remains governed by
this License without regard to the additional permissions.

  When you convey a copy of a covered work, you may at your option
remove any additional permissions from that copy, or from any part of
it.  (Additional permissions may be written to require their own
removal in certain cases when you modify the work.)  You may place
additional permissions on material, added by you to a covered work,
for which you have or can give appropriate copyright permission.

  Notwithstanding any other provision of this License, for material you
add to a covered work, you may (if authorized by the copyright holders of
that material) supplement the terms of this License with terms:

    a) Disclaiming warranty or limiting liability differently from the
    terms of sections 15 and 16 of this License; or

    b) Requiring preservation of specified reasonable legal notices or
    author attributions in that material or in the Appropriate Legal
    Notices displayed by works containing it; or

    c) Prohibiting misrepresentation of the origin of that material, or
    requiring that modified versions of such material be marked in
    reasonable ways as different from the original version; or

    d) Limiting the use for publicity purposes of names of licensors or
    authors of the material; or

    e) Declining to grant rights under trademark law for use of some
    trade names, trademarks, or service marks; or

    f) Requiring indemnification of licensors and authors of that
    material by anyone who conveys the material (or modified versions of
    it) with contractual assumptions of liability to the recipient, for
    any liability that these contractual assumptions directly impose on
    those licensors and authors.

  All other non-permissive additional terms are considered "further
restrictions" within the meaning of section 10.  If the Program as you
received it, or any part of it, contains a notice stating that it is
governed by this License along with a term that is a further
restriction, you may remove that term.  If a license document contains
a further restriction but permits relicensing or conveying under this
License, you may add to a covered work material governed by the terms
of that license document, provided that the further restriction does
not survive such relicensing or conveying.

  If you add terms to a covered work in accord with this section, you
must place, in the relevant source files, a statement of the
additional terms that apply to those files, or a notice indicating
where to find the applicable terms.

  Additional terms, permissive or non-permissive, may be stated in the
form of a separately written license, or stated as exceptions;
the above requirements apply either way.

  8. Termination.

  You may not propagate or modify a covered work except as expressly
provided under this License.  Any attempt otherwise to propagate or
modify it is void, and will automatically terminate your rights under
this License (including any patent licenses granted under the third
paragraph of section 11).

  However, if you cease all violation of this License, then your
license from a particular copyright holder is reinstated (a)
provisionally, unless and until the copyright holder explicitly and
finally terminates your license, and (b) permanently, if the copyright
holder fails to notify you of the violation by some reasonable means
prior to 60 days after the cessation.

  Moreover, your license from a particular copyright holder is
reinstated permanently if the copyright holder notifies you of the
violation by some reasonable means, this is the first time you have
received notice of violation of this License (for any work) from that
copyright holder, and you cure the violation prior to 30 days after
your receipt of the notice.

  Termination of your rights under this section does not terminate the
licenses of parties who have received copies or rights from you under
this License.  If your rights have been terminated and not permanently
reinstated, you do not qualify to receive new licenses for the same
material under section 10.

  9. Acceptance Not Required for Having Copies.

  You are not required to accept this License in order to receive or
run a copy of the Program.  Ancillary propagation of a covered work
occurring solely as a consequence of using peer-to-peer transmission
to receive a copy likewise does not require acceptance.  However,
nothing other than this License grants you permission to propagate or
modify any covered work.  These actions infringe copyright if you do
not accept this License.  Therefore, by modifying or propagating a
covered work, you indicate your acceptance of this License to do so.

  10. Automatic Licensing of Downstream Recipients.

  Each time you convey a covered work, the recipient automatically
receives a license from the original licensors, to run, modify and
propagate that work, subject to this License.  You are not responsible
for enforcing compliance by third parties with this License.

  An "entity transaction" is a transaction transferring control of an
organization, or substantially all assets of one, or subdividing an
organization, or merging organizations.  If propagation of a covered
work results from an entity transaction, each party to that
transaction who receives a copy of the work also receives whatever
licenses to the work the party's predecessor in interest had or could
give under the previous paragraph, plus a right to possession of the
Corresponding Source of the work from the predecessor in interest, if
the predecessor has it or can get it with reasonable efforts.

  You may not impose any further restrictions on the exercise of the
rights granted or affirmed under this License.  For example, you may
not impose a license fee, royalty, or other charge for exercise of
rights granted under this License, and you may not initiate litigation
(including a cross-claim or counterclaim in a lawsuit) alleging that
any patent claim is infringed by making, using, selling, offering for
sale, or importing the Program or any portion of it.

  11. Patents.

  A "contributor" is a copyright holder who authorizes use under this
License of the Program or a work on which the Program is based.  The
work thus licensed is called the contributor's "contributor version".

  A contributor's "essential patent claims" are all patent claims
owned or controlled by the contributor, whether already acquired or
hereafter acquired, that would be infringed by some manner, permitted
by this License, of making, using, or selling its contributor version,
but do not include claims that would be infringed only as a
consequence of further modification of the contributor version.  For
purposes of this definition, "control" includes the right to grant
patent sublicenses in a manner consistent with the requirements of
this License.

  Each contributor grants you a non-exclusive, worldwide, royalty-free
patent license under the contributor's essential patent claims, to
make, use, sell, offer for sale, import and otherwise run, modify and
propagate the contents of its contributor version.

  In the following three paragraphs, a "patent license" is any express
agreement or commitment, however denominated, not to enforce a patent
(such as an express permission to practice a patent or covenant not to
sue for patent infringement).  To "grant" such a patent license to a
party means to make such an agreement or commitment not to enforce a
patent against the party.

  If you convey a covered work, knowingly relying on a patent license,
and the Corresponding Source of the work is not available for anyone
to copy, free of charge and under the terms of this License, through a
publicly available network server or other readily accessible means,
then you must either (1) cause the Corresponding Source to be so
available, or (2) arrange to deprive yourself of the benefit of the
patent license for this particular work, or (3) arrange, in a manner
consistent with the requirements of this License, to extend the patent
license to downstream recipients.  "Knowingly relying" means you have
actual knowledge that, but for the patent license, your conveying the
covered work in a country, or your recipient's use of the covered work
in a country, would infringe one or more identifiable patents in that
country that you have reason to believe are valid.

  If, pursuant to or in connection with a single transaction or
arrangement, you convey, or propagate by procuring conveyance of, a
covered work, and grant a patent license to some of the parties
receiving the covered work authorizing them to use, propagate, modify
or convey a specific copy of the covered work, then the patent license
you grant is automatically extended to all recipients of the covered
work and works based on it.

  A patent license is "discriminatory" if it does not include within
the scope of its coverage, prohibits the exercise of, or is
conditioned on the non-exercise of one or more of the rights that are
specifically granted under this License.  You may not convey a covered
work if you are a party to an arrangement with a third party that is
in the business of distributing software, under which you make payment
to the third party based on the extent of your activity of conveying
the work, and under which the third party grants, to any of the
parties who would receive the covered work from you, a discriminatory
patent license (a) in connection with copies of the covered work
conveyed by you (or copies made from those copies), or (b) primarily
for and in connection with specific products or compilations that
contain the covered work, unless you entered into that arrangement,
or that patent license was granted, prior to 28 March 2007.

  Nothing in this License shall be construed as excluding or limiting
any implied license or other defenses to infringement that may
otherwise be available to you under applicable patent law.

  12. No Surrender of Others' Freedom.

  If conditions are imposed on you (whether by court order, agreement or
otherwise) that contradict the conditions of this License, they do not
excuse you from the conditions of this License.  If you cannot convey a
covered work so as to satisfy simultaneously your obligations under this
License and any other pertinent obligations, then as a consequence you may
not convey it at all.  For example, if you agree to terms that obligate you
to collect a royalty for further conveying from those to whom you convey
the Program, the only way you could satisfy both those terms and this
License would be to refrain entirely from conveying the Program.

  13. Use with the GNU Affero General Public License.

  Notwithstanding any other provision of this License, you have
permission to link or combine any covered work with a work licensed
under version 3 of the GNU Affero General Public License into a single
combined work, and to convey the resulting work.  The terms of this
License will continue to apply to the part which is the covered work,
but the special requirements of the GNU Affero General Public License,
section 13, concerning interaction through a network will apply to the
combination as such.

  14. Revised Versions of this License.

  The Free Software Foundation may publish revised and/or new versions of
the GNU General Public License from time to time.  Such new versions will
be similar in spirit to the present version, but may differ in detail to
address new problems or concerns.

  Each version is given a distinguishing version number.  If the
Program specifies that a certain numbered version of the GNU General
Public License "or any later version" applies to it, you have the
option of following the terms and conditions either of that numbered
version or of any later version published by the Free Software
Foundation.  If the Program does not specify a version number of the
GNU General Public License, you may choose any version ever published
by the Free Software Foundation.

  If the Program specifies that a proxy can decide which future
versions of the GNU General Public License can be used, that proxy's
public statement of acceptance of a version permanently authorizes you
to choose that version for the Program.

  Later license versions may give you additional or different
permissions.  However, no additional obligations are imposed on any
author or copyright holder as a result of your choosing to follow a
later version.

  15. Disclaimer of Warranty.

  THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY
APPLICABLE LAW.  EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT
HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY
OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
PURPOSE.  THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM
IS WITH YOU.  SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF
ALL NECESSARY SERVICING, REPAIR OR CORRECTION.

  16. Limitation of Liability.

  IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING
WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MODIFIES AND/OR CONVEYS
THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY
GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE
USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF
DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD
PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS),
EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF
SUCH DAMAGES.

  17. Interpretation of Sections 15 and 16.

  If the disclaimer of warranty and limitation of liability provided
above cannot be given local legal effect according to their terms,
reviewing courts shall apply local law that most closely approximates
an absolute waiver of all civil liability in connection with the
Program, unless a warranty or assumption of liability accompanies a
copy of the Program in return for a fee.

                     END OF TERMS AND CONDITIONS

            How to Apply These Terms to Your New Programs

  If you develop a new program, and you want it to be of the greatest
possible use to the public, the best way to achieve this is to make it
free software which everyone can redistribute and change under these terms.

  To do so, attach the following notices to the program.  It is safest
to attach them to the start of each source file to most effectively
state the exclusion of warranty; and each file should have at least
the "copyright" line and a pointer to where the full notice is found.

    <one line to give the program's name and a brief idea of what it does.>
    Copyright (C) <year>  <name of author>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

Also add information on how to contact you by electronic and paper mail.

  If the program does terminal interaction, make it output a short
notice like this when it starts in an interactive mode:

    <program>  Copyright (C) <year>  <name of author>
    This program comes with ABSOLUTELY NO WARRANTY; for details type `show w'.
    This is free software, and you are welcome to redistribute it
    under certain conditions; type `show c' for details.

The hypothetical commands `show w' and `show c' should show the appropriate
parts of the General Public License.  Of course, your program's commands
might be different; for a GUI interface, you would use an "about box".

  You should also get your employer (if you work as a programmer) or school,
if any, to sign a "copyright disclaimer" for the program, if necessary.
For more information on this, and how to apply and follow the GNU GPL, see
<https://www.gnu.org/licenses/>.

  The GNU General Public License does not permit incorporating your program
into proprietary programs.  If your program is a subroutine library, you
may consider it more useful to permit linking proprietary applications with
the library.  If this is what you want to do, use the GNU Lesser General
Public License instead of this License.  But first, please read
<https://www.gnu.org/licenses/why-not-lgpl.html>.
*/

(() => {
'use strict';
const createCore = function createCore() {
    const API_PATH = '/xlive/web-room/v2/index/getRoomPlayInfo';
    const DEFAULTS = Object.freeze({ enabled: true, protocol: 'flv', autoRecover: false, preferredHost: 'auto' });

    function preferences(raw) {
        const value = raw && typeof raw === 'object' ? raw : {};
        return {
            enabled: typeof value.enabled === 'boolean' ? value.enabled : DEFAULTS.enabled,
            protocol: value.protocol === 'native' ? 'native' : 'flv',
            autoRecover: value.autoRecover === true,
            preferredHost: typeof value.preferredHost === 'string' &&
                /^[a-z0-9.-]+$/i.test(value.preferredHost) && value.preferredHost.length <= 253
                ? value.preferredHost.toLowerCase() : 'auto',
        };
    }

    function isPlayInfoUrl(value) {
        try {
            const url = new URL(String(value));
            return url.origin === 'https://api.live.bilibili.com' && !url.username && !url.password && url.pathname === API_PATH;
        } catch (_) { return false; }
    }

    function requestUrl(value, options, pinnedQuality) {
        if (!isPlayInfoUrl(value) || !options.enabled) return value;
        const url = new URL(String(value));
        if (options.protocol === 'flv') {
            for (const key of ['protocol', 'format', 'codec']) {
                const values = new Set((url.searchParams.get(key) || '').split(',').filter(Boolean));
                values.add('0');
                url.searchParams.set(key, [...values].join(','));
            }
        }
        if (Number.isInteger(pinnedQuality) && pinnedQuality > 0) url.searchParams.set('qn', String(pinnedQuality));
        return url.href;
    }

    function codecEntries(streams) {
        if (!Array.isArray(streams)) return [];
        return streams.flatMap(stream => Array.isArray(stream?.format) ? stream.format.flatMap(format =>
            Array.isArray(format?.codec) ? format.codec.map(codec => ({ stream, format, codec })) : []) : []);
    }

    function infoHost(info, codec, nowSeconds = Date.now() / 1000) {
        try {
            if (typeof info?.host !== 'string' || typeof info.extra !== 'string' ||
                typeof codec?.base_url !== 'string' || !codec.base_url.startsWith('/') ||
                codec.base_url.startsWith('//')) return null;
            const host = new URL(info.host);
            if (host.protocol !== 'https:' || host.username || host.password || host.search || host.hash || host.pathname !== '/') return null;
            const url = new URL(info.host + codec.base_url + info.extra);
            if (url.origin !== host.origin) return null;
            const expiry = Number(url.searchParams.get('expires'));
            if (expiry > 0 && expiry <= nowSeconds) return null;
            return host.hostname;
        } catch (_) { return null; }
    }

    function selectPlayInfo(payload, options, nowSeconds = Date.now() / 1000) {
        const playurl = payload?.data?.playurl_info?.playurl;
        const entries = codecEntries(playurl?.stream);
        const result = { payload, changed: false, candidates: [], quality: null, fallbackReason: '' };
        if (!entries.length || (payload.code !== undefined && payload.code !== 0)) return result;
        const qualities = entries.map(({ codec }) => Number(codec?.current_qn));
        if (qualities.some(quality => !Number.isInteger(quality) || quality <= 0)) {
            result.fallbackReason = '画质信息不完整，保留原生方案';
            return result;
        }
        const quality = Math.max(...qualities);
        result.quality = quality || null;
        if (!options.enabled) return result;
        if (entries.some(({ codec }) => codec?.drm)) {
            result.fallbackReason = '受保护直播保持原生播放';
            return result;
        }
        const flv = entries.filter(({ stream, format, codec }) => stream.protocol_name === 'http_stream' &&
            format.format_name === 'flv' && codec?.codec_name === 'avc' &&
            Number(codec.current_qn) === quality && Array.isArray(codec.url_info) &&
            codec.url_info.some(info => infoHost(info, codec, nowSeconds)));
        if (options.protocol === 'flv' && !flv.length) {
            result.fallbackReason = '没有同画质 FLV，保留原生方案';
            return result;
        }
        const allowed = options.protocol === 'flv' ? new Set(flv.map(item => item.codec)) : null;
        const hosts = new Set();
        const streams = playurl.stream.flatMap(stream => {
            if (!Array.isArray(stream?.format)) return allowed ? [] : [stream];
            const formats = stream.format.flatMap(format => {
                if (!Array.isArray(format?.codec)) return allowed ? [] : [format];
                const codecs = format.codec.flatMap(codec => {
                    if (allowed && !allowed.has(codec)) return [];
                    if (Number(codec?.current_qn) !== quality || !Array.isArray(codec?.url_info)) return [codec];
                    const valid = codec.url_info.filter(info => infoHost(info, codec, nowSeconds));
                    for (const info of valid) hosts.add(infoHost(info, codec, nowSeconds));
                    // Native mode leaves invalid/unknown entries intact unless reordering a valid preferred host.
                    const urls = allowed ? valid : codec.url_info.slice();
                    const preferred = urls.findIndex(info => infoHost(info, codec, nowSeconds) === options.preferredHost);
                    if (preferred > 0) urls.unshift(...urls.splice(preferred, 1));
                    return [{ ...codec, url_info: urls }];
                });
                return codecs.length ? [{ ...format, codec: codecs }] : [];
            });
            return formats.length ? [{ ...stream, format: formats }] : [];
        });
        result.candidates = [...hosts];
        if (options.protocol === 'native' && options.preferredHost === 'auto') return result;
        result.changed = true;
        result.payload = { ...payload, data: { ...payload.data, playurl_info: {
            ...payload.data.playurl_info, playurl: { ...playurl, stream: streams },
        } } };
        return result;
    }

    function mediaAddress(value) {
        try {
            const url = new URL(value);
            if (url.protocol !== 'https:') return { host: '', protocol: '未知' };
            return { host: url.hostname, protocol: /\.flv$/i.test(url.pathname) ? 'FLV' :
                /\.m3u8$/i.test(url.pathname) ? 'HLS' : '未知' };
        } catch (_) { return { host: '', protocol: '未知' }; }
    }

    function createRecoveryPolicy() {
        let key;
        let started = 0;
        let last;
        let stallStart = null;
        let counted = false;
        let count = 0;
        let duration = 0;
        let attempts = [];
        let lastRecovery = -Infinity;

        function finish(now) {
            if (counted && stallStart !== null) duration += Math.max(0, now - stallStart);
            stallStart = null;
            counted = false;
        }
        function reset(now = 0, nextKey) {
            finish(last?.now ?? now);
            key = nextKey;
            started = now;
            last = undefined;
        }
        function tick(sample) {
            const now = sample.now;
            if (!Number.isFinite(now)) return { action: null, state: 'unknown' };
            if (key !== sample.key) reset(now, sample.key);
            const previous = last;
            last = sample;
            attempts = attempts.filter(time => now - time < 600000);
            const excluded = !sample.hasVideo || sample.hidden || sample.paused || sample.ended || sample.seeking ||
                !Number.isFinite(sample.currentTime) || !Number.isFinite(sample.playbackRate) ||
                sample.playbackRate <= 0 || sample.live !== true || sample.timeShift ||
                !previous || now - previous.now > 3500 || now - previous.now < 0 || now - started < 15000;
            if (excluded) { finish(previous?.now ?? now); return { action: null, state: 'excluded' }; }
            const advancing = sample.currentTime - previous.currentTime > 0.05;
            const starving = Number.isFinite(sample.buffer) && sample.buffer <= 0.35 && sample.readyState < 3;
            if (advancing || !starving) {
                finish(now);
                return { action: null, state: advancing ? 'playing' : 'not-network-stall' };
            }
            if (stallStart === null) stallStart = previous.now;
            const elapsed = now - stallStart;
            if (elapsed >= 3000 && !counted) { count++; counted = true; }
            const canRecover = sample.enabled && sample.autoRecover && sample.canReconnect &&
                elapsed >= 8000 && now - lastRecovery >= 90000 && attempts.length < 2;
            return { action: canRecover ? 'recover' : null, state: 'starving', elapsed,
                limited: attempts.length >= 2 || now - lastRecovery < 90000 };
        }
        function markRecovery(now) { lastRecovery = now; attempts.push(now); finish(now); started = now; }
        function snapshot(now) {
            return { stallCount: count, stallSeconds: (duration +
                (counted && stallStart !== null ? Math.max(0, (now ?? last?.now ?? stallStart) - stallStart) : 0)) / 1000,
            recoveryCount: attempts.length };
        }
        return { tick, reset, markRecovery, snapshot };
    }

    // Observation is intentionally independent of the conservative recovery policy.
    // It stores only numeric measurements, never media URLs or player objects.
    function createPlaybackMonitor() {
        let last;
        let epoch = 0;
        let pending = null;
        let active = null;
        let queued = [];
        let drops = [];
        let lastDropEvent = -Infinity;
        const counts = { buffering: 0, freeze: 0 };
        const durations = { buffering: 0, freeze: 0 };

        const finite = value => Number.isFinite(value);
        const buffer = sample => finite(sample?.buffer) && sample.buffer >= 0 ? sample.buffer : null;
        const kindFor = sample => buffer(sample) !== null && sample.buffer <= 0.35 &&
            finite(sample.readyState) && sample.readyState < 3 ? 'buffering' : 'freeze';
        const eligible = sample => sample?.hasVideo === true && !sample.hidden && !sample.paused &&
            !sample.ended && !sample.seeking && finite(sample.playbackRate) && sample.playbackRate > 0;
        const counters = sample => finite(sample?.dropped) && finite(sample?.total) &&
            sample.dropped >= 0 && sample.total >= sample.dropped;

        function finish(now, sample, events) {
            if (active) {
                const durationMs = Math.max(0, now - active.start);
                durations[active.kind] += durationMs;
                events.push({ type: active.kind, phase: 'end', at: now, durationMs,
                    bufferSeconds: buffer(sample) });
            }
            active = null;
            pending = null;
        }

        function confirmPending(now, sample, events) {
            if (!pending || now - pending.start < pending.threshold) return;
            const kind = pending.source === 'frame' ? 'freeze' : pending.kind;
            active = { start: pending.start, source: pending.source, kind };
            counts[kind]++;
            events.push({ type: kind, phase: 'start', at: now,
                durationMs: now - active.start, bufferSeconds: pending.bufferSeconds });
            pending = null;
        }

        function clearSegment(now, events) {
            // Do not turn an unobserved gap, a pause or a seek into stall time.
            finish(last?.now ?? now, last, events);
            last = undefined;
            epoch = now;
            drops = [];
        }

        function dropTotals(now) {
            drops = drops.filter(item => item.at > now - 5000 && item.at <= now);
            const value = drops.reduce((sum, item) => ({
                dropped: sum.dropped + item.dropped, total: sum.total + item.total,
            }), { dropped: 0, total: 0 });
            value.percent = value.total > 0 ? value.dropped / value.total * 100 : null;
            return value;
        }

        function observeDrops(sample, previous, events) {
            if (!previous || !counters(previous) || !counters(sample)) { drops = []; return; }
            const dropped = sample.dropped - previous.dropped;
            const total = sample.total - previous.total;
            if (dropped < 0 || total < 0 || dropped > total) { drops = []; return; }
            if (total > 0) drops.push({ at: sample.now, dropped, total });
            const recent = dropTotals(sample.now);
            if (recent.total >= 30 && recent.dropped >= 3 && recent.percent >= 5 &&
                sample.now - lastDropEvent >= 15000) {
                events.push({ type: 'drop', phase: 'sample', at: sample.now,
                    dropped: recent.dropped, total: recent.total, percent: recent.percent });
                lastDropEvent = sample.now;
            }
        }

        function snapshot(now = last?.now ?? 0) {
            const observedNow = last && finite(now) ? Math.min(now, last.now) : last?.now ?? 0;
            const bufferingMs = durations.buffering + (active?.kind === 'buffering'
                ? Math.max(0, observedNow - active.start) : 0);
            const freezeMs = durations.freeze + (active?.kind === 'freeze'
                ? Math.max(0, observedNow - active.start) : 0);
            return {
                stallCount: counts.buffering + counts.freeze,
                stallSeconds: (bufferingMs + freezeMs) / 1000,
                bufferingCount: counts.buffering, bufferingSeconds: bufferingMs / 1000,
                freezeCount: counts.freeze, freezeSeconds: freezeMs / 1000,
                recentDropPercent: dropTotals(finite(now) ? now : observedNow).percent,
            };
        }

        function observe(sample, mediaType) {
            const events = queued;
            queued = [];
            if (!sample || !finite(sample.now)) return { metrics: snapshot(), events };
            const now = sample.now;
            if (!last || last.key !== sample.key || now - last.now > 1500 || now < last.now) {
                clearSegment(now, events);
            }
            if (!eligible(sample)) {
                clearSegment(now, events);
                return { metrics: snapshot(now), events };
            }
            let previous = last;
            if (previous && finite(previous.currentTime) && finite(sample.currentTime) &&
                sample.currentTime < previous.currentTime - 0.05) {
                clearSegment(now, events);
                previous = undefined;
            }
            last = { now, key: sample.key, currentTime: sample.currentTime,
                dropped: sample.dropped, total: sample.total, buffer: buffer(sample) };
            observeDrops(sample, previous, events);
            if (mediaType === 'playing') {
                // The exact end event can confirm a short wait between sampling ticks.
                // Keep its last waiting classification, not the now-replenished buffer.
                if (pending?.source === 'event') confirmPending(now, sample, events);
                finish(now, sample, events);
                return { metrics: snapshot(now), events };
            }

            const clockKnown = previous && finite(previous.currentTime) && finite(sample.currentTime);
            const advancing = clockKnown && sample.currentTime > previous.currentTime + 0.00001;
            const stopped = clockKnown && !advancing;
            const frameStale = advancing && sample.frameMonitorAvailable === true &&
                finite(sample.frameAgeMs) && sample.frameAgeMs >= 1000;

            if (active && !(stopped || frameStale || (!clockKnown && active.source === 'event'))) {
                finish(clockKnown ? now : previous?.now ?? now, sample, events);
            } else if (pending && !(stopped || frameStale || (!clockKnown && pending.source === 'event'))) {
                pending = null;
            }

            if (!active && (mediaType === 'waiting' || mediaType === 'stalled')) {
                pending = { start: pending?.start ?? now, source: 'event', threshold: 250,
                    kind: kindFor(sample), bufferSeconds: buffer(sample) };
            }
            if (!active && !pending && frameStale) {
                pending = { start: Math.max(epoch, now - sample.frameAgeMs), source: 'frame', threshold: 1000,
                    kind: 'freeze', bufferSeconds: buffer(sample) };
            }
            if (!active && !pending && stopped) {
                pending = { start: previous.now, source: 'clock', threshold: 750,
                    kind: kindFor(sample), bufferSeconds: buffer(sample) };
            }
            if (pending) {
                pending.kind = pending.source === 'frame' ? 'freeze' : kindFor(sample);
                pending.bufferSeconds = buffer(sample);
                confirmPending(now, sample, events);
            }
            return { metrics: snapshot(now), events };
        }

        function reset(now = last?.now ?? 0) {
            clearSegment(finite(now) ? now : last?.now ?? 0, queued);
        }
        return { tick: sample => observe(sample), mediaEvent: (type, sample) => observe(sample, type), snapshot, reset };
    }

    // Diagnostics are allowlisted, never a dump of the API or player objects.
    function diagnostic(view) {
        const number = value => Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
        const host = value => typeof value === 'string' && /^[a-z0-9.-]+$/i.test(value) ? value : null;
        const actual = view.actual || {};
        return JSON.stringify({ product: 'Bilibili Live Accelerator', version: String(view.version),
            preferences: preferences({ enabled: view.enabled, protocol: view.protocolPreference,
                autoRecover: view.autoRecover, preferredHost: view.preferredHost }),
            playback: { protocol: ['FLV', 'HLS'].includes(actual.protocol) ? actual.protocol : '未知',
                host: host(actual.host), quality: /^\d+(?:_\d+)?$/.test(String(actual.quality)) ? String(actual.quality) : null,
                resolution: /^\d+x\d+$/.test(actual.resolution || '') ? actual.resolution : null,
                bufferSeconds: number(actual.buffer), droppedFrames: number(actual.dropped), decodedFrames: number(actual.total),
                stallCount: number(actual.stallCount), stallSeconds: number(actual.stallSeconds),
                bufferingCount: number(actual.bufferingCount), bufferingSeconds: number(actual.bufferingSeconds),
                freezeCount: number(actual.freezeCount), freezeSeconds: number(actual.freezeSeconds),
                recentDropPercent: number(actual.recentDropPercent), frameMonitorAvailable: actual.frameMonitorAvailable === true },
            candidateHosts: (view.candidates || []).map(item => host(item.host)).filter(Boolean),
            nativeReconnectAvailable: view.canReconnect === true, conflict: view.conflict === true,
        }, null, 2);
    }
    return { defaults: DEFAULTS, preferences, isPlayInfoUrl, requestUrl, selectPlayInfo,
        mediaAddress, createRecoveryPolicy, createPlaybackMonitor, diagnostic };
};
const mountPanel = function mountPanel(root, actions) {
  const registryKey = '__BILI_LIVE_ACCELERATOR_PANEL__';
  if (root[registryKey] && typeof root[registryKey].render === 'function') {
    return root[registryKey];
  }

  const document = root.document;
  let destroyed = false;
  let expanded = false;
  let latestView = {};
  let eventSignature = '';
  let copyGeneration = 0;
  const removers = [];
  const optionNodes = new Map();

  const host = document.createElement('div');
  host.id = 'bilibili-live-accelerator-panel';
  host.style.cssText = 'all:initial;position:fixed;right:16px;bottom:72px;z-index:2147483000;display:block;color-scheme:light dark;font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host { --bg:#fff; --fg:#202832; --muted:#647184; --line:#e3e8ee;
      --soft:#f3f6f9; --accent:#087fa3; --warn:#825b12; font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    * { box-sizing:border-box; }
    [hidden] { display:none !important; }
    button,select,textarea,input { font:inherit; }
    button,select { color:var(--fg); background:var(--bg); border:1px solid var(--line); border-radius:7px; }
    button { cursor:pointer; padding:7px 10px; }
    button:hover:not(:disabled) { background:var(--soft); }
    button:disabled { opacity:.5; cursor:default; }
    button:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
    .launcher { width:44px; height:44px; padding:0; border-radius:50%; color:#fff; background:#087fa3; border:1px solid #087fa3;
      box-shadow:0 3px 15px #0003; display:grid; place-items:center; font-size:11px; font-weight:700; line-height:1.1; white-space:pre-line; }
    .launcher:hover:not(:disabled) { background:#066c8a; }
    .panel { width:340px; max-width:calc(100vw - 24px); max-height:min(680px,calc(100dvh - 104px));
      overflow:auto; border:1px solid var(--line); border-radius:12px; background:var(--bg); color:var(--fg); box-shadow:0 6px 28px #0003; }
    header { display:flex; align-items:center; gap:8px; padding:12px 14px 8px; }
    h2 { font-size:14px; line-height:1.3; margin:0; flex:1; }
    .version { font-size:10px; color:var(--muted); font-weight:400; }
    .close { border:0; padding:4px 8px; font-size:18px; line-height:1; }
    section { padding:10px 14px; border-top:1px solid var(--line); }
    h3 { margin:0 0 7px; font-size:12px; color:var(--muted); font-weight:600; }
    .quality { margin:0 0 6px; font-size:15px; font-weight:650; }
    dl { margin:0; display:grid; grid-template-columns:62px minmax(0,1fr); gap:5px 9px; }
    dt { color:var(--muted); }
    dd { margin:0; overflow-wrap:anywhere; font-variant-numeric:tabular-nums; }
    .status { margin:8px 0 0; color:var(--muted); overflow-wrap:anywhere; }
    .notice { background:var(--soft); border-radius:6px; padding:7px 8px; margin-top:8px; color:var(--warn); overflow-wrap:anywhere; }
    .setting { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:8px 0; }
    .setting:first-child { margin-top:0; }
    .setting label { cursor:pointer; }
    .setting input { width:16px; height:16px; margin:0; accent-color:var(--accent); flex:none; }
    .setting select { width:142px; padding:5px 6px; }
    .line-label { display:block; margin-bottom:5px; }
    .line-select { display:block; width:100%; padding:6px 7px; }
    .hint { color:var(--muted); font-size:11px; margin:6px 0 0; }
    .buttons { display:flex; flex-wrap:wrap; gap:7px; margin-top:10px; }
    .buttons button { flex:1; white-space:nowrap; }
    .copy-result { color:var(--muted); margin:7px 0 0; font-size:12px; }
    textarea { display:block; width:100%; height:132px; resize:vertical; margin-top:7px; padding:7px; border:1px solid var(--line);
      border-radius:6px; color:var(--fg); background:var(--soft); font-size:11px; }
    ol { padding-left:0; list-style:none; margin:0; max-height:132px; overflow:auto; }
    li { margin:4px 0; overflow-wrap:anywhere; font-size:11px; }
    time { color:var(--muted); margin-right:7px; font-variant-numeric:tabular-nums; }
    .empty { color:var(--muted); font-size:11px; margin:0; }
    @media (prefers-color-scheme:dark) { :host { --bg:#19212b; --fg:#e7edf5; --muted:#a7b5c6; --line:#35404e; --soft:#242e3a; --accent:#51c7ed; --warn:#ebc36b; } }
    @media (max-width:420px) { .panel { width:calc(100vw - 24px); } section { padding:9px 12px; } }
    @media (prefers-reduced-motion:no-preference) { button { transition:background .12s ease; } }
  `;
  shadow.appendChild(style);

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function listen(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    removers.push(() => target.removeEventListener(type, listener, options));
  }

  function text(node, value) {
    const next = value == null || value === '' ? '未知' : String(value);
    if (node.textContent !== next) node.textContent = next;
  }

  function number(value, digits) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? value.toFixed(digits) : null;
  }

  function invoke(name, value) {
    if (!actions || typeof actions[name] !== 'function') return;
    try {
      const result = actions[name](value);
      if (result && typeof result.catch === 'function') {
        result.catch(() => showCopyMessage('操作未完成，请稍后重试。'));
      }
    } catch (_) {
      showCopyMessage('操作未完成，请稍后重试。');
    }
  }

  const launcher = element('button', 'launcher', '直播\n加速');
  launcher.type = 'button';
  launcher.setAttribute('aria-label', '打开 Bilibili 直播加速面板');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'bla-details');
  launcher.title = 'Bilibili 直播加速：查看实际播放状态';
  shadow.appendChild(launcher);

  const panel = element('aside', 'panel');
  panel.id = 'bla-details';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Bilibili 直播加速设置和实际播放状态');
  const header = element('header');
  const heading = element('h2', '', 'Bilibili Live Accelerator ');
  const version = element('span', 'version');
  heading.appendChild(version);
  header.appendChild(heading);
  const closeButton = element('button', 'close', '×');
  closeButton.type = 'button';
  closeButton.title = '折叠面板';
  closeButton.setAttribute('aria-label', '折叠面板');
  header.appendChild(closeButton);
  panel.appendChild(header);

  const observed = element('section');
  observed.appendChild(element('h3', '', '实际播放 · 由播放器观测'));
  const quality = element('p', 'quality', '画质未知');
  observed.appendChild(quality);
  const details = element('dl');
  const metrics = {};
  [['protocol', '协议'], ['host', 'CDN'], ['video', '画面'], ['buffer', '缓冲'],
    ['stall', '总停顿'], ['buffering', '缓冲等待'], ['freeze', '疑似冻结'],
    ['recentDropped', '近期掉帧'], ['dropped', '累计掉帧']].forEach(([key, label]) => {
    details.appendChild(element('dt', '', label));
    metrics[key] = element('dd', '', '未知');
    details.appendChild(metrics[key]);
  });
  observed.appendChild(details);
  observed.appendChild(element('p', 'hint', '记录本页可观测的短暂停顿；0 次不等于完全流畅。掉帧单列，不计入停顿次数。分类是状态观测，不是原因确诊。'));
  observed.appendChild(element('p', 'hint', '近期掉帧取近 5 秒；累计掉帧由播放器提供，切换流后可能重置。'));
  const status = element('p', 'status');
  const notice = element('div', 'notice');
  notice.hidden = true;
  const conflict = element('div', 'notice');
  conflict.hidden = true;
  observed.appendChild(status);
  observed.appendChild(notice);
  observed.appendChild(conflict);
  panel.appendChild(observed);

  const settings = element('section');
  settings.appendChild(element('h3', '', '播放偏好 · 不代表当前状态'));
  function checkbox(id, label, action) {
    const row = element('div', 'setting');
    const labelNode = element('label', '', label);
    labelNode.htmlFor = id;
    const input = element('input');
    input.id = id;
    input.type = 'checkbox';
    row.appendChild(labelNode);
    row.appendChild(input);
    settings.appendChild(row);
    listen(input, 'change', () => invoke(action, input.checked));
    return input;
  }
  const enabled = checkbox('bla-enabled', '启用直播优化', 'setEnabled');
  const protocolRow = element('div', 'setting');
  const protocolLabel = element('label', '', '协议偏好');
  protocolLabel.htmlFor = 'bla-protocol';
  const protocol = element('select');
  protocol.id = 'bla-protocol';
  [['flv', '同画质 FLV 优先'], ['native', 'B 站默认']].forEach(([value, label]) => {
    const option = element('option', '', label);
    option.value = value;
    protocol.appendChild(option);
  });
  protocolRow.appendChild(protocolLabel);
  protocolRow.appendChild(protocol);
  settings.appendChild(protocolRow);
  listen(protocol, 'change', () => invoke('setProtocol', protocol.value));
  const autoRecover = checkbox('bla-recover', '持续卡住时自动恢复', 'setAutoRecover');
  settings.appendChild(element('p', 'hint', '自动恢复默认关闭。切流保护期只限制自动恢复，不屏蔽可观测的等待记录。'));
  const lineLabel = element('label', 'line-label', '线路偏好');
  lineLabel.htmlFor = 'bla-host';
  const line = element('select', 'line-select');
  line.id = 'bla-host';
  settings.appendChild(lineLabel);
  settings.appendChild(line);
  settings.appendChild(element('p', 'hint', '只选 B 站返回的有效线路。换线可能短暂重新加载；不自动降低画质。'));
  listen(line, 'change', () => invoke('selectHost', line.value));
  const buttons = element('div', 'buttons');
  const reconnect = element('button', '', '重新连接');
  reconnect.type = 'button';
  const defaults = element('button', '', '恢复默认');
  defaults.type = 'button';
  buttons.appendChild(reconnect);
  buttons.appendChild(defaults);
  settings.appendChild(buttons);
  listen(reconnect, 'click', () => invoke('reconnect'));
  listen(defaults, 'click', () => invoke('restoreDefaults'));
  panel.appendChild(settings);

  const diagnostics = element('section');
  diagnostics.appendChild(element('h3', '', '诊断 · 仅本地，不上报'));
  const copy = element('button', '', '复制诊断报告');
  copy.type = 'button';
  diagnostics.appendChild(copy);
  const copyMessage = element('p', 'copy-result');
  copyMessage.hidden = true;
  copyMessage.setAttribute('role', 'status');
  const manualCopyLabel = element('label', 'hint', '诊断报告（只读，可手动复制）');
  manualCopyLabel.htmlFor = 'bla-diagnostic';
  manualCopyLabel.hidden = true;
  const manualCopy = element('textarea');
  manualCopy.id = 'bla-diagnostic';
  manualCopy.readOnly = true;
  manualCopy.hidden = true;
  manualCopy.spellcheck = false;
  diagnostics.appendChild(copyMessage);
  diagnostics.appendChild(manualCopyLabel);
  diagnostics.appendChild(manualCopy);
  panel.appendChild(diagnostics);

  function showCopyMessage(message) {
    if (destroyed) return;
    text(copyMessage, message);
    copyMessage.hidden = false;
  }

  listen(copy, 'click', async () => {
    const generation = ++copyGeneration;
    let report;
    try {
      report = actions && typeof actions.getDiagnostic === 'function' ? actions.getDiagnostic() : '';
      if (typeof report !== 'string' || !report.trim()) throw new Error('No report');
    } catch (_) {
      showCopyMessage('暂时无法生成报告，请稍后重试。');
      return;
    }
    manualCopy.value = report;
    try {
      if (!root.navigator.clipboard || typeof root.navigator.clipboard.writeText !== 'function') throw new Error('No clipboard');
      await root.navigator.clipboard.writeText(report);
      if (destroyed || generation !== copyGeneration) return;
      manualCopy.hidden = true;
      manualCopyLabel.hidden = true;
      showCopyMessage('已复制。报告仅包含诊断信息，不会自动发送。');
    } catch (_) {
      if (destroyed || generation !== copyGeneration) return;
      manualCopy.hidden = false;
      manualCopyLabel.hidden = false;
      showCopyMessage('浏览器未允许复制，请选中下面的报告手动复制。');
      manualCopy.focus();
      manualCopy.select();
    }
  });

  const history = element('section');
  history.appendChild(element('h3', '', '最近事件'));
  const events = element('ol');
  const emptyEvents = element('p', 'empty', '暂无事件');
  history.appendChild(events);
  history.appendChild(emptyEvents);
  panel.appendChild(history);
  shadow.appendChild(panel);

  function setExpanded(value, restoreFocus) {
    if (destroyed) return;
    expanded = Boolean(value);
    panel.hidden = !expanded;
    launcher.hidden = expanded;
    launcher.setAttribute('aria-expanded', String(expanded));
    if (restoreFocus) (expanded ? closeButton : launcher).focus();
  }
  listen(launcher, 'click', () => setExpanded(true, true));
  listen(closeButton, 'click', () => setExpanded(false, true));
  listen(shadow, 'keydown', (event) => {
    if (event.key === 'Escape' && expanded) {
      event.preventDefault();
      event.stopPropagation();
      setExpanded(false, true);
    }
  });

  function fullscreenChanged() {
    const full = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    host.style.display = full ? 'none' : 'block';
  }
  listen(document, 'fullscreenchange', fullscreenChanged);
  listen(document, 'webkitfullscreenchange', fullscreenChanged);

  function renderOptions(view) {
    const preferred = typeof view.preferredHost === 'string' && view.preferredHost ? view.preferredHost : 'auto';
    const candidates = Array.isArray(view.candidates) ? view.candidates : [];
    const labels = new Map([['auto', '自动（B 站默认顺序）']]);
    for (const candidate of candidates) {
      if (!candidate || typeof candidate.host !== 'string' || !candidate.host || candidate.host === 'auto') continue;
      // An offered or preferred candidate is not proof that it is playing.
      const selected = Boolean(view.actual && view.actual.host === candidate.host);
      labels.set(candidate.host, candidate.host + (selected ? '（当前播放）' : ''));
    }
    if (preferred !== 'auto' && !labels.has(preferred)) labels.set(preferred, preferred + '（当前未提供）');
    for (const [value, node] of optionNodes) {
      if (!labels.has(value)) {
        node.remove();
        optionNodes.delete(value);
      }
    }
    let position = 0;
    for (const [value, label] of labels) {
      let option = optionNodes.get(value);
      if (!option) {
        option = element('option', '', label);
        option.value = value;
        optionNodes.set(value, option);
      }
      text(option, label);
      if (line.children[position] !== option) line.insertBefore(option, line.children[position] || null);
      position += 1;
    }
    if (line.value !== preferred) line.value = preferred;
  }

  function render(view) {
    if (destroyed) return;
    latestView = view && typeof view === 'object' ? view : {};
    const actual = latestView.actual && typeof latestView.actual === 'object' ? latestView.actual : {};
    version.textContent = latestView.version ? 'v' + latestView.version : '';
    text(quality, actual.qualityLabel || '画质未知');
    const protocolName = actual.protocol;
    text(metrics.protocol, protocolName === 'flv' ? 'HTTP-FLV' : protocolName === 'hls' ? 'HLS' : protocolName);
    text(metrics.host, actual.host);
    let resolution = actual.resolution;
    if (resolution && typeof resolution === 'object') {
      resolution = resolution.width && resolution.height ? resolution.width + ' × ' + resolution.height : null;
    }
    const fps = number(actual.fps, 0);
    text(metrics.video, (resolution || '分辨率未知') + ' · ' + (fps === null ? '帧率未知' : fps + ' FPS'));
    const buffer = number(actual.buffer, 2);
    text(metrics.buffer, buffer === null ? null : buffer + ' 秒');
    for (const [key, countKey, secondsKey] of [
      ['stall', 'stallCount', 'stallSeconds'],
      ['buffering', 'bufferingCount', 'bufferingSeconds'],
      ['freeze', 'freezeCount', 'freezeSeconds'],
    ]) {
      const count = number(actual[countKey], 0);
      const seconds = number(actual[secondsKey], 1);
      text(metrics[key], (count === null ? '次数未知' : count + ' 次') + ' · ' + (seconds === null ? '时长未知' : seconds + ' 秒'));
    }
    const recentDropPercent = number(actual.recentDropPercent, 1);
    text(metrics.recentDropped, recentDropPercent === null ? '未知（近 5 秒）' : recentDropPercent + '%（近 5 秒）');
    const dropped = number(actual.dropped, 0);
    const total = number(actual.total, 0);
    const ratio = typeof actual.total === 'number' && Number.isFinite(actual.total) && actual.total > 0 && typeof actual.dropped === 'number' && Number.isFinite(actual.dropped) && actual.dropped >= 0
      ? (actual.dropped / actual.total * 100).toFixed(1) : null;
    text(metrics.dropped, dropped === null ? null : dropped + ' / ' + (total === null ? '未知' : total) + (ratio === null ? '' : '（' + ratio + '%）'));
    text(status, latestView.statusText || '等待播放状态');
    notice.hidden = !latestView.notice;
    if (latestView.notice) text(notice, latestView.notice);
    conflict.hidden = !latestView.conflict;
    if (latestView.conflict) text(conflict, typeof latestView.conflict === 'string' ? latestView.conflict : '检测到其他播放优化脚本；建议关闭以避免冲突。');
    enabled.checked = latestView.enabled !== false;
    protocol.value = latestView.protocolPreference === 'native' ? 'native' : 'flv';
    autoRecover.checked = latestView.autoRecover === true;
    reconnect.disabled = latestView.canReconnect !== true;
    reconnect.title = reconnect.disabled ? '播放器尚未准备好，暂时无法重连' : '保持当前画质重新获取有效播放地址';
    renderOptions(latestView);
    const recent = (Array.isArray(latestView.events) ? latestView.events : []).slice(-8);
    const signature = JSON.stringify(recent.map((item) => [item && item.time, item && item.message]));
    if (signature !== eventSignature) {
      eventSignature = signature;
      while (events.firstChild) events.removeChild(events.firstChild);
      for (const item of recent) {
        if (!item) continue;
        const row = element('li');
        if (item.time != null) {
          let timestamp = String(item.time);
          if (typeof item.time === 'number' && Number.isFinite(item.time)) timestamp = new Date(item.time).toLocaleTimeString([], { hour12: false });
          row.appendChild(element('time', '', timestamp));
        }
        row.appendChild(element('span', '', item.message == null ? '' : String(item.message)));
        events.appendChild(row);
      }
      emptyEvents.hidden = events.childElementCount > 0;
    }
    launcher.title = '直播加速：' + (latestView.enabled === false ? '已关闭' : '已启用') + '；' + (actual.qualityLabel || '画质未知');
  }

  let pendingMount = false;
  function attach() {
    if (destroyed || host.isConnected) return;
    const parent = document.body || document.documentElement;
    if (parent) parent.appendChild(host);
  }
  const api = {
    render,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      copyGeneration += 1;
      for (const remove of removers.splice(0)) remove();
      host.remove();
      optionNodes.clear();
      if (root[registryKey] === api) delete root[registryKey];
    },
  };
  root[registryKey] = api;
  attach();
  if (!host.isConnected) {
    pendingMount = true;
    listen(document, 'DOMContentLoaded', () => {
      if (pendingMount) attach();
      pendingMount = false;
    }, { once: true });
  }
  fullscreenChanged();
  render({});
  return api;
};
const startAccelerator = function startAccelerator(root, createCore, mountPanel, version) {
    const PUBLIC_KEY = '__BILI_LIVE_ACCELERATOR__';
    const OLD_KEY = '__BILI_LIVE_FLV_STATUS__';
    const STORAGE_KEY = 'bilibili-live-accelerator:v1';
    if (!root || !/^\/[1-9]\d*\/?$/.test(root.location?.pathname || '')) return null;
    if (root[PUBLIC_KEY]) return root[PUBLIC_KEY];

    const core = createCore();
    const document = root.document;
    let preferences = core.preferences();
    try { preferences = core.preferences(JSON.parse(root.localStorage.getItem(STORAGE_KEY))); } catch (_) { /* Optional storage. */ }
    let disposed = false;
    let conflict = Boolean(root[OLD_KEY]);
    let panel;
    let notice = '';
    let candidates = [];
    let candidateQuality = null;
    let bootstrap;
    let pin = null;
    let busy = false;
    let autoBlocked = false;
    let lastManual = -Infinity;
    let graceUntil = 0;
    let lastNow = 0;
    let lastView;
    let interval = null;
    let settingsGeneration = 0;
    let postCheck;
    let watchedVideo;
    let frameCallback = null;
    let lastFrameAt = null;
    let frameMonitorAvailable = false;
    let lastPolicyAt = -Infinity;
    let lastDecision = { state: 'unknown' };
    let nextVideoId = 1;
    const videoIds = new WeakMap();
    const events = [];
    const removers = [];
    const videoRemovers = [];
    const hookRestorers = [];
    const timeouts = new Set();
    const policy = core.createRecoveryPolicy();
    // Measuring interruptions must not inherit the much stricter reconnect gate.
    const playbackMonitor = core.createPlaybackMonitor();

    function now() {
        const value = root.performance?.now ? root.performance.now() : Date.now();
        lastNow = Math.max(lastNow, Number.isFinite(value) ? value : lastNow);
        return lastNow;
    }
    function event(message) {
        events.push({ time: Date.now(), message });
        if (events.length > 12) events.shift();
    }
    function playbackEvents(result) {
        const entries = Array.isArray(result?.events) ? result.events : [];
        let changed = false;
        for (const entry of entries) {
            if (!entry || !['buffering', 'freeze', 'drop'].includes(entry.type)) continue;
            const duration = Number.isFinite(entry.durationMs) ? `：持续 ${(entry.durationMs / 1000).toFixed(2)} 秒` : '';
            const buffer = Number.isFinite(entry.bufferSeconds) ? `（缓冲 ${entry.bufferSeconds.toFixed(2)} 秒）` : '';
            if (entry.type === 'drop' && entry.phase === 'sample' && Number.isFinite(entry.percent)) {
                event(`近期掉帧率 ${entry.percent.toFixed(1)}%；掉帧不等同于网络卡顿。`);
            } else if (entry.type !== 'drop' && entry.phase === 'start') {
                event(`检测到${entry.type === 'buffering' ? '缓冲等待' : '画面停滞'}${buffer}。`);
            } else if (entry.type !== 'drop' && entry.phase === 'end') {
                event(`${entry.type === 'buffering' ? '缓冲等待' : '画面停滞'}结束${duration}。`);
            } else continue;
            changed = true;
        }
        return changed;
    }
    function setNotice(message) { notice = message; }
    function save() {
        preferences = core.preferences(preferences);
        try { root.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }
        catch (_) { setNotice('浏览器未允许保存设置；本次页面仍然有效。'); }
    }
    function active() {
        if (!conflict && root[OLD_KEY]) {
            conflict = true;
            candidates = [];
            candidateQuality = null;
            event('检测到旧版 FLV 脚本，已停止重复优化。');
        }
        return !disposed && preferences.enabled && !conflict;
    }
    function options() { return { ...preferences, enabled: active() }; }
    function listen(target, type, handler, list = removers) {
        if (!target?.addEventListener) return;
        target.addEventListener(type, handler);
        list.push(() => target.removeEventListener(type, handler));
    }
    function later(handler, delay) {
        const id = root.setTimeout(() => { timeouts.delete(id); if (!disposed) handler(); }, delay);
        timeouts.add(id);
        return id;
    }
    function cancelLater(id) { root.clearTimeout(id); timeouts.delete(id); }
    function numericQuality(value) {
        const number = Number(String(value ?? '').split('_')[0]);
        return Number.isInteger(number) && number > 0 ? number : null;
    }
    function clone(value) {
        try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
    }
    function allCodecs(payload) {
        const streams = payload?.data?.playurl_info?.playurl?.stream;
        if (!Array.isArray(streams)) return [];
        return streams.flatMap(stream => Array.isArray(stream?.format) ? stream.format.flatMap(format =>
            Array.isArray(format?.codec) ? format.codec : []) : []);
    }
    function rememberCandidates(result) {
        candidateQuality = result.quality;
        const wall = Date.now();
        const expiryByHost = new Map();
        for (const codec of allCodecs(result.payload)) {
            if (Number(codec?.current_qn) !== candidateQuality || !Array.isArray(codec.url_info)) continue;
            for (const info of codec.url_info) {
                try {
                    const address = new URL(info.host + codec.base_url + info.extra);
                    const expiry = Number(address.searchParams.get('expires'));
                    const until = expiry > 0 ? expiry * 1000 - 30000 : wall + 60000;
                    expiryByHost.set(address.hostname, Math.max(expiryByHost.get(address.hostname) || 0, until));
                } catch (_) { /* Only the core's validated host allowlist is exposed. */ }
            }
        }
        candidates = result.candidates.map(host => ({ host, until: expiryByHost.get(host) || wall }));
        if (result.fallbackReason) setNotice(result.fallbackReason);
    }
    function select(payload) {
        if (!active()) return { payload, changed: false };
        const result = core.selectPlayInfo(payload, options(), Date.now() / 1000);
        rememberCandidates(result);
        return result;
    }
    function currentCandidates(quality) {
        if (!active() || numericQuality(quality) !== candidateQuality) return [];
        return candidates.filter(candidate => candidate.until > Date.now()).map(candidate => ({ host: candidate.host }));
    }
    function requestUrl(value) {
        if (!active()) return value;
        let quality;
        if (pin && pin.until >= now() && pin.remaining > 0) {
            quality = pin.quality;
            pin.remaining--;
        }
        return core.requestUrl(value, options(), quality);
    }

    // Retain initial data only in this closure. Never cache network responses.
    function processInitial(value) {
        const payload = value?.roomInitRes;
        const published = payload?.data?.playurl_info?.playurl;
        if (!published || !Array.isArray(published.stream) || !active()) return;
        if (!bootstrap || bootstrap.published !== published) {
            const source = clone(payload);
            bootstrap = source ? { source, published, applied: published.stream, captured: Date.now() } : null;
        }
        const result = select(bootstrap?.source || payload);
        if (result.changed) {
            published.stream = result.payload.data.playurl_info.playurl.stream;
            if (bootstrap) bootstrap.applied = published.stream;
        }
    }
    function bootstrapFresh(source, captured) {
        if (Date.now() - captured > 60000) return false;
        let found = false;
        for (const codec of allCodecs(source)) {
            for (const info of Array.isArray(codec?.url_info) ? codec.url_info : []) {
                try {
                    const url = new URL(info.host + codec.base_url + info.extra);
                    if (url.protocol !== 'https:') continue;
                    const expiry = Number(url.searchParams.get('expires'));
                    if (expiry > 0 && expiry * 1000 <= Date.now() + 30000) return false;
                    found = true;
                } catch (_) { return false; }
            }
        }
        return found;
    }
    function updateBootstrap(quality) {
        if (!active() || !quality || !bootstrap || bootstrap.published.stream !== bootstrap.applied ||
            !bootstrapFresh(bootstrap.source, bootstrap.captured)) return;
        const sourceQuality = Math.max(0, ...allCodecs(bootstrap.source).map(codec => Number(codec?.current_qn) || 0));
        if (sourceQuality !== quality) return;
        const result = core.selectPlayInfo(bootstrap.source, options(), Date.now() / 1000);
        const next = result.payload?.data?.playurl_info?.playurl?.stream;
        if (Array.isArray(next)) {
            bootstrap.published.stream = next;
            bootstrap.applied = next;
        }
    }
    function hookInitial() {
        const key = '__NEPTUNE_IS_MY_WAIFU__';
        const before = Object.getOwnPropertyDescriptor(root, key);
        if (before && (('writable' in before && !before.writable) || (before.get && !before.set))) return;
        let stored = before?.get ? before.get.call(root) : root[key];
        processInitial(stored);
        if (before && (!before.configurable || ('writable' in before && !before.writable) ||
            (before.get && !before.set))) return;
        const get = before?.get ? function () { return before.get.call(root); } : function () { return stored; };
        const set = function (value) {
            if (!disposed) { try { processInitial(value); } catch (_) { event('初始播放信息保持原样。'); } }
            if (before?.set) before.set.call(root, value);
            else stored = value;
        };
        Object.defineProperty(root, key, { configurable: true, enumerable: before?.enumerable ?? true, get, set });
        hookRestorers.push(() => {
            const current = Object.getOwnPropertyDescriptor(root, key);
            if (current?.get !== get || current?.set !== set) return;
            if (before?.get || before?.set) Object.defineProperty(root, key, before);
            else Object.defineProperty(root, key, { ...(before || { configurable: true, enumerable: true, writable: true }), value: stored });
        });
    }
    function hookFetch() {
        const original = root.fetch;
        if (typeof original !== 'function') return;
        const wrapped = async function (...args) {
            const input = args[0];
            const value = input && typeof input === 'object' && 'url' in input ? input.url : input;
            const method = String(args[1]?.method || input?.method || 'GET').toUpperCase();
            const eligible = method === 'GET' && core.isPlayInfoUrl(value);
            if (eligible && active()) {
                const rewritten = requestUrl(value);
                if (String(rewritten) !== String(value)) {
                    args[0] = root.Request && input instanceof root.Request ? new root.Request(rewritten, input) : rewritten;
                }
            }
            const response = await original.apply(this, args);
            if (!eligible || !response.ok || !active()) return response;
            try {
                const result = select(await response.clone().json());
                if (!result.changed) return response;
                const headers = new root.Headers(response.headers);
                headers.delete('content-length');
                headers.delete('content-encoding');
                const replacement = new root.Response(JSON.stringify(result.payload), {
                    status: response.status, statusText: response.statusText, headers,
                });
                for (const key of ['url', 'type', 'redirected']) Object.defineProperty(replacement, key, { value: response[key] });
                return replacement;
            } catch (_) {
                event('播放接口响应保持原样。');
                return response;
            }
        };
        root.fetch = wrapped;
        hookRestorers.push(() => { if (root.fetch === wrapped) root.fetch = original; });
    }
    function hookXhr() {
        const prototype = root.XMLHttpRequest?.prototype;
        if (!prototype || typeof prototype.open !== 'function') return;
        const requests = new WeakMap();
        const beforeOpen = prototype.open;
        const wrappedOpen = function (...args) {
            const eligible = String(args[0]).toUpperCase() === 'GET' && core.isPlayInfoUrl(args[1]);
            requests.set(this, eligible);
            if (eligible && active()) args[1] = requestUrl(args[1]);
            return beforeOpen.apply(this, args);
        };
        prototype.open = wrappedOpen;
        hookRestorers.push(() => { if (prototype.open === wrappedOpen) prototype.open = beforeOpen; });
        function eligible(xhr) {
            return requests.get(xhr) && xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300 &&
                core.isPlayInfoUrl(xhr.responseURL) && active();
        }
        for (const key of ['responseText', 'response']) {
            const before = Object.getOwnPropertyDescriptor(prototype, key);
            if (!before?.get || !before.configurable) continue;
            const get = function () {
                const value = before.get.call(this);
                if (!eligible(this)) return value;
                try {
                    if (key === 'response' && this.responseType === 'json' && value && typeof value === 'object') {
                        return select(value).payload;
                    }
                    if (typeof value !== 'string' || (key === 'response' && this.responseType && this.responseType !== 'text')) return value;
                    const result = select(JSON.parse(value));
                    return result.changed ? JSON.stringify(result.payload) : value;
                } catch (_) { return value; }
            };
            Object.defineProperty(prototype, key, { ...before, get });
            hookRestorers.push(() => {
                if (Object.getOwnPropertyDescriptor(prototype, key)?.get === get) Object.defineProperty(prototype, key, before);
            });
        }
    }

    function nativePlayer() {
        const known = [root.EmbedPlayer?.instance, root.livePlayer];
        return known.find(player => player && typeof player.getPlayerInfo === 'function' && typeof player.reload === 'function') || null;
    }
    function videoLike(value) {
        return value && typeof value === 'object' && typeof value.currentTime === 'number' && typeof value.paused === 'boolean';
    }
    function stopFrameMonitor() {
        if (frameCallback !== null) {
            try { watchedVideo?.cancelVideoFrameCallback?.(frameCallback); } catch (_) { /* Video was replaced. */ }
        }
        frameCallback = null;
        lastFrameAt = null;
        frameMonitorAvailable = false;
    }
    function startFrameMonitor(video) {
        if (typeof video?.requestVideoFrameCallback !== 'function') return;
        frameMonitorAvailable = true;
        const next = () => {
            if (disposed || watchedVideo !== video) return;
            try {
                frameCallback = video.requestVideoFrameCallback(() => {
                    frameCallback = null;
                    if (disposed || watchedVideo !== video) return;
                    lastFrameAt = now();
                    next();
                });
            } catch (_) {
                frameCallback = null;
                lastFrameAt = null;
                frameMonitorAvailable = false;
            }
        };
        next();
    }
    function mediaEvent(video, type) {
        if (disposed || watchedVideo !== video) return;
        if (['pause', 'ended', 'seeking'].includes(type)) stopFrameMonitor();
        if (['playing', 'seeked'].includes(type) && !frameMonitorAvailable &&
            !video.paused && !video.ended && document.visibilityState !== 'hidden') startFrameMonitor(video);
        const observation = observe();
        if (observation.video !== video) return;
        const changed = playbackEvents(playbackMonitor.mediaEvent(type, observation.sample));
        if (changed) render(observation, lastDecision);
    }
    function watch(video) {
        if (watchedVideo === video) return;
        for (const remove of videoRemovers.splice(0)) remove();
        stopFrameMonitor();
        watchedVideo = video;
        graceUntil = now() + 15000;
        policy.reset(now());
        playbackMonitor.reset(now());
        if (!video) return;
        if (!videoIds.has(video)) videoIds.set(video, nextVideoId++);
        const grace = type => {
            graceUntil = now() + 15000;
            policy.reset(now());
            if (type === 'loadedmetadata') {
                playbackMonitor.reset(now());
                // A source change can reuse the media element, but not its old
                // presented-frame timestamp or pending callback.
                stopFrameMonitor();
                startFrameMonitor(video);
            }
            mediaEvent(video, type);
        };
        for (const type of ['seeking', 'seeked', 'loadedmetadata']) {
            listen(video, type, () => grace(type), videoRemovers);
        }
        for (const type of ['waiting', 'stalled', 'playing', 'pause', 'ended']) {
            listen(video, type, () => mediaEvent(video, type), videoRemovers);
        }
        startFrameMonitor(video);
    }
    function bufferRemaining(video, player) {
        try {
            const ranges = video?.buffered;
            const time = video?.currentTime;
            if (ranges && Number.isFinite(time)) {
                for (let index = 0; index < ranges.length; index++) {
                    if (ranges.start(index) <= time + 0.05 && ranges.end(index) >= time) return Math.max(0, ranges.end(index) - time);
                }
                return 0;
            }
        } catch (_) { /* Some media elements throw during replacement. */ }
        try {
            const value = player?.remainBufferLength?.();
            return Number.isFinite(value) && value >= 0 ? value : null;
        } catch (_) { return null; }
    }
    function observe() {
        const player = nativePlayer();
        let info = null;
        let video = null;
        try { info = player?.getPlayerInfo(); } catch (_) { /* Not ready. */ }
        try {
            const value = typeof player?.getVideoEl === 'function' ? player.getVideoEl() : player?.getVideoEl;
            if (videoLike(value)) video = value;
        } catch (_) { /* Not ready. */ }
        const nativeVideo = Boolean(video);
        if (!video) {
            try {
                const nodes = document.querySelectorAll('video');
                if (nodes.length === 1 && videoLike(nodes[0])) video = nodes[0];
            } catch (_) { /* No DOM yet. */ }
        }
        watch(video);
        let address = core.mediaAddress(info?.playurl);
        if (!address.host && video) address = core.mediaAddress(video.currentSrc || video.src);
        const quality = info?.quality == null ? null : String(info.quality);
        let dropped = null;
        let total = null;
        try {
            const metrics = video?.getVideoPlaybackQuality?.();
            if (Number.isFinite(metrics?.droppedVideoFrames)) dropped = metrics.droppedVideoFrames;
            if (Number.isFinite(metrics?.totalVideoFrames)) total = metrics.totalVideoFrames;
        } catch (_) { /* Metrics are optional. */ }
        const width = Number(video?.videoWidth);
        const height = Number(video?.videoHeight);
        let qualityLabel = quality ? `画质 ${quality}` : '画质未知';
        const description = Array.isArray(info?.qualityCandidates) ? info.qualityCandidates.find(item =>
            numericQuality(item?.qn ?? item?.code) === numericQuality(quality))?.desc : null;
        if (typeof description === 'string' && description.length <= 100) qualityLabel = description;
        const timestamp = now();
        const sample = {
            now: timestamp,
            key: `${video ? videoIds.get(video) : 0}|${quality || ''}|${address.host}`,
            hasVideo: Boolean(video), hidden: document.visibilityState === 'hidden',
            paused: !video || video.paused, ended: Boolean(video?.ended),
            seeking: Boolean(video?.seeking), mediaSeeking: Boolean(video?.seeking),
            playbackRate: Number(video?.playbackRate) || 0,
            live: info?.liveStatus === 1, timeShift: Number(info?.timeShift) || 0,
            currentTime: Number(video?.currentTime),
            buffer: bufferRemaining(video, player), readyState: Number(video?.readyState) || 0,
            dropped, total, frameMonitorAvailable,
            frameAgeMs: frameMonitorAvailable && lastFrameAt !== null ? Math.max(0, timestamp - lastFrameAt) : null,
            enabled: active(), autoRecover: preferences.autoRecover && !autoBlocked,
            canReconnect: Boolean(player && nativeVideo && !busy),
        };
        return { player, video, info, sample, actual: {
            ...address, quality, qualityLabel,
            resolution: width > 0 && height > 0 ? `${width}x${height}` : null,
            fps: null, buffer: sample.buffer, dropped, total,
        } };
    }
    function operable(observation) {
        const sample = observation.sample;
        return sample.canReconnect && sample.live && !sample.paused && !sample.ended && !sample.hidden &&
            !observation.video?.seeking && !sample.timeShift;
    }
    function statusText(observation, decision) {
        const sample = observation.sample;
        if (busy) return '正在重新连接；不会同时发起第二次重连。';
        if (!sample.hasVideo) return '等待直播视频。';
        if (sample.hidden) return '后台页面：暂停卡顿判断与自动恢复。';
        if (sample.paused) return '已暂停：不会自动重新连接。';
        if (!sample.live) return '未确认正在直播：仅监测，不自动恢复。';
        if (sample.timeShift) return '时移播放：不会自动重新连接。';
        if (sample.seeking) return '正在定位播放位置：不计入卡顿，也不会自动恢复。';
        if (sample.now < graceUntil) return '播放切换观察期：继续记录卡顿，暂不自动恢复。';
        if (decision.state === 'starving') return '缓冲不足，正在观察网络卡顿。';
        if (decision.state === 'playing') return '播放时间正在推进；短顿与掉帧单独记录。';
        return '正在观察播放状态。';
    }
    function verify(observation) {
        if (!postCheck || now() < postCheck.due) return;
        const actual = observation.actual;
        if (!actual.host && now() < postCheck.expires) return;
        if (!actual.host) {
            setNotice('暂时无法确认重连结果；已停止本页自动恢复。');
            autoBlocked = true;
        } else if (postCheck.quality && numericQuality(actual.quality) !== postCheck.quality) {
            setNotice('重连后画质发生变化，请手动确认原画；已停止本页自动恢复。');
            autoBlocked = true;
            event('重连后的实际画质需要人工确认。');
        } else if (postCheck.host !== 'auto' && actual.host !== postCheck.host) {
            setNotice('播放器未采用所选线路，可能使用了原生回退；不会循环重连。');
            autoBlocked = true;
            event('实际线路与偏好不同，保持当前播放。');
        } else {
            setNotice('已重新连接；请以实际播放状态为准。');
            event('已核对重连后的实际播放状态。');
        }
        postCheck = null;
    }
    function render(observation, decision) {
        if (disposed) return;
        const recoveryMetrics = policy.snapshot(observation.sample.now);
        const metrics = playbackMonitor.snapshot(observation.sample.now);
        lastView = {
            version, enabled: preferences.enabled, protocolPreference: preferences.protocol,
            autoRecover: preferences.autoRecover, preferredHost: preferences.preferredHost,
            actual: { ...observation.actual, frameMonitorAvailable: observation.sample.frameMonitorAvailable,
                networkStallCount: recoveryMetrics.stallCount,
                recoveryCount: recoveryMetrics.recoveryCount, ...metrics },
            candidates: currentCandidates(observation.actual.quality),
            canReconnect: operable(observation) && !busy && now() - lastManual >= 15000,
            conflict, notice,
            statusText: statusText(observation, decision), events: events.slice(),
        };
        panel?.render(lastView);
    }
    function sample() {
        if (disposed) return;
        const observation = observe();
        const recorded = playbackEvents(playbackMonitor.tick(observation.sample));
        const policyDue = observation.sample.now - lastPolicyAt >= 1000;
        if (policyDue) {
            lastPolicyAt = observation.sample.now;
            lastDecision = policy.tick({ ...observation.sample,
                seeking: observation.sample.seeking || observation.sample.now < graceUntil });
            verify(observation);
        }
        if (policyDue || recorded) render(observation, lastDecision);
        if (policyDue && lastDecision.action === 'recover' && !busy) void reconnect(true);
    }
    function updateView() {
        if (disposed) return;
        const observation = observe();
        render(observation, { state: 'unknown' });
    }
    async function reconnect(automatic = false) {
        if (disposed || busy) { if (!disposed) setNotice('正在重连，请等待当前操作结束。'); return false; }
        const observation = observe();
        if (!operable(observation)) {
            setNotice('请在前台正常播放直播后重试；暂停、时移和未知播放器不自动重连。');
            updateView();
            return false;
        }
        if (!automatic && now() - lastManual < 15000) {
            setNotice('手动重连间隔至少 15 秒；偏好已保存，可稍后点击重新连接。');
            updateView();
            return false;
        }
        if (automatic) {
            if (!active() || !preferences.autoRecover || autoBlocked) return false;
            if (!observation.actual.host) {
                autoBlocked = true;
                setNotice('无法确认当前播放线路，已停止本页自动恢复；不会盲目重试。');
                updateView();
                return false;
            }
            const offered = currentCandidates(observation.actual.quality);
            const next = offered.find(candidate => candidate.host !== observation.actual.host);
            if (!next) {
                autoBlocked = true;
                setNotice('当前没有同画质有效备线，已停止本页自动恢复；请手动刷新检查。');
                event('没有有效备线，未发起自动重连。');
                updateView();
                return false;
            }
            preferences.preferredHost = next.host;
            settingsGeneration++;
            save();
            policy.markRecovery(now());
            event('持续网络卡顿，尝试当前画质的官方备线。');
        } else {
            lastManual = now();
            event('用户请求重新连接，保持当前画质。');
        }
        busy = true;
        const quality = numericQuality(observation.actual.quality);
        pin = quality && active() ? { quality, until: now() + 15000, remaining: 1 } : null;
        updateBootstrap(quality);
        const expectedHost = preferences.preferredHost;
        const operationGeneration = settingsGeneration;
        const timeout = later(() => {
            setNotice('重连耗时较长；等待原操作结束，不会叠加重连。');
            if (automatic) autoBlocked = true;
            updateView();
        }, 15000);
        updateView();
        try {
            await observation.player.reload.call(observation.player);
            if (disposed) return false;
            if (operationGeneration !== settingsGeneration) {
                postCheck = null;
                setNotice('设置已变更；当前重连已结束，刷新页面可确保新设置生效。');
                return true;
            }
            postCheck = { quality, host: expectedHost, due: now() + 6000, expires: now() + 20000 };
            setNotice('已重新获取播放地址，正在核对实际线路与画质。');
            return true;
        } catch (_) {
            if (!disposed) {
                autoBlocked = true;
                setNotice('原生播放器重连失败；已停止本页自动恢复，请手动刷新检查。');
                event('原生播放器重连失败。');
            }
            return false;
        } finally {
            cancelLater(timeout);
            pin = null;
            busy = false;
            graceUntil = now() + 15000;
            policy.reset(now());
            updateView();
        }
    }

    const actions = {
        setEnabled(value) {
            preferences.enabled = value === true;
            settingsGeneration++;
            save();
            candidates = [];
            candidateQuality = null;
            setNotice(preferences.enabled ? '优化已启用；点击重新连接或刷新后应用。' : '已停止修改新的播放请求；刷新页面可完全恢复 B 站原生播放。');
            event(preferences.enabled ? '已启用直播优化。' : '已关闭直播优化。');
            updateView();
        },
        setProtocol(value) {
            if (value !== 'flv' && value !== 'native') return false;
            if (busy) { setNotice('正在重连，请等待当前操作结束后再更改协议。'); updateView(); return false; }
            preferences.protocol = value;
            settingsGeneration++;
            candidates = [];
            candidateQuality = null;
            save();
            event(value === 'flv' ? '已选择同画质 FLV 优先。' : '已选择跟随 B 站原生协议。');
            if (!active()) { setNotice('偏好已保存；优化关闭或存在脚本冲突，当前播放未改动。'); updateView(); return false; }
            return reconnect(false);
        },
        setAutoRecover(value) {
            preferences.autoRecover = value === true;
            autoBlocked = false;
            graceUntil = now() + 15000;
            policy.reset(now());
            save();
            event(preferences.autoRecover ? '已启用保守自动恢复。' : '已关闭自动恢复。');
            setNotice(preferences.autoRecover ? '仅持续网络卡顿且有同画质备线时恢复；90 秒冷却，10 分钟最多 2 次。' : '自动恢复已关闭。');
            updateView();
        },
        selectHost(host) {
            if (busy) { setNotice('正在重连，请等待当前操作结束后再更改线路。'); updateView(); return false; }
            const observation = observe();
            if (host !== 'auto' && !currentCandidates(observation.actual.quality).some(candidate => candidate.host === host)) {
                setNotice('该线路已过期或不是当前画质候选；请重新获取播放信息。');
                updateView();
                return false;
            }
            preferences.preferredHost = host;
            settingsGeneration++;
            save();
            event(host === 'auto' ? '已恢复 B 站默认线路顺序。' : '已选择当前画质的官方候选线路。');
            if (!active()) { setNotice('偏好已保存；当前播放未改动。'); updateView(); return false; }
            return reconnect(false);
        },
        reconnect: () => reconnect(false),
        restoreDefaults() {
            preferences = core.preferences({ enabled: false, protocol: 'native', autoRecover: false, preferredHost: 'auto' });
            settingsGeneration++;
            autoBlocked = false;
            candidates = [];
            candidateQuality = null;
            save();
            event('已恢复 B 站原生设置。');
            setNotice('已关闭优化并恢复原生偏好；刷新页面可完全恢复原生播放。');
            updateView();
            return true;
        },
        getDiagnostic() {
            if (!lastView) updateView();
            return core.diagnostic(lastView || { version });
        },
    };
    const api = {
        version: String(version),
        getDiagnostic: actions.getDiagnostic,
        dispose() {
            if (disposed) return;
            disposed = true;
            root.clearInterval(interval);
            stopFrameMonitor();
            for (const id of timeouts) root.clearTimeout(id);
            timeouts.clear();
            for (const remove of videoRemovers.splice(0)) remove();
            for (const remove of removers.splice(0)) remove();
            for (const restore of hookRestorers.reverse()) {
                try { restore(); } catch (_) { /* Another script may now own this hook. */ }
            }
            bootstrap = null;
            candidates = [];
            pin = null;
            panel?.destroy();
            if (root[PUBLIC_KEY] === api) delete root[PUBLIC_KEY];
        },
    };
    root[PUBLIC_KEY] = api;
    if (conflict) event('检测到旧版 FLV 脚本，已停止重复优化。');
    for (const install of [hookInitial, hookFetch, hookXhr]) {
        try { install(); } catch (_) { event('部分播放接口无法接入，保持原生方案。'); }
    }
    listen(document, 'visibilitychange', () => {
        graceUntil = now() + 15000;
        policy.reset(now());
        // End any foreground segment before the browser throttles its timers;
        // cumulative counters are intentionally retained.
        playbackEvents(playbackMonitor.tick(observe().sample));
        playbackMonitor.reset(now());
        stopFrameMonitor();
        if (document.visibilityState !== 'hidden' && watchedVideo && !watchedVideo.paused && !watchedVideo.ended) {
            startFrameMonitor(watchedVideo);
        }
        updateView();
    });
    listen(root, 'pagehide', () => api.dispose());
    try { panel = mountPanel(root, actions); } catch (_) { event('状态面板暂时无法显示。'); }
    interval = root.setInterval(sample, 250);
    event('本地直播优化已就绪；自动恢复默认关闭。');
    sample();
    return api;
};
startAccelerator(window, createCore, mountPanel, "0.2.0");
})();
